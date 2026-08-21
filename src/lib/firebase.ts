import { initializeApp } from 'firebase/app'
import {
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore'
import firebaseConfig from '../../firebase-applet-config.json'

// Initialize Firebase App
export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string
  operationType: OperationType
  path: string | null
  authInfo: {
    userId?: string | null
    email?: string | null
    emailVerified?: boolean | null
    isAnonymous?: boolean | null
    tenantId?: string | null
    providerInfo?: {
      providerId?: string | null
      email?: string | null
    }[]
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo))
  throw new Error(JSON.stringify(errInfo))
}

// Test initial connection to Firestore as mandated
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'))
    return true
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.')
    }
    return false
  }
}

// Trigger connection test on module load
testConnection().catch(() => {})

// Authentication helpers
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    if (result.user) {
      await syncUserProfile(result.user)
    }
    return result.user
  } catch (error: any) {
    console.error('Google Sign-in error:', error)
    throw error
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export async function syncUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid)
  const path = `users/${user.uid}`
  try {
    const existingSnap = await getDoc(userRef)
    const now = new Date().toISOString()
    if (!existingSnap.exists()) {
      await setDoc(userRef, {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: now,
        updatedAt: now,
      })
    } else {
      await updateDoc(userRef, {
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        updatedAt: now,
      })
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path)
  }
}

// Firestore Real-Time Data Sync Services
export const firebaseSync = {
  // Settings sync
  async getSettings(userId: string) {
    const path = `users/${userId}/settings/current`
    try {
      const snap = await getDoc(doc(db, 'users', userId, 'settings', 'current'))
      if (snap.exists()) {
        return snap.data()
      }
      return null
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path)
      return null
    }
  },

  async saveSettings(userId: string, settings: any) {
    const path = `users/${userId}/settings/current`
    try {
      const dataToSave = {
        userId,
        trade_amount: Number(settings.trade_amount) || 1.0,
        selected_symbol: String(settings.selected_symbol || 'BTCUSDT'),
        bot_strategy: String(settings.bot_strategy || 'multi_layer_pro'),
        bot_running: Boolean(settings.bot_running),
        trailing_stop_percent: Number(settings.trailing_stop_percent) || 1.8,
        min_volume_usdt: Number(settings.min_volume_usdt) || 1000000,
        auto_dust_sweep: Boolean(settings.auto_dust_sweep),
        cooldown_seconds: Number(settings.cooldown_seconds) || 1.5,
        api_key: settings.api_key || null,
        api_secret: settings.api_secret || null,
        updatedAt: new Date().toISOString(),
      }
      await setDoc(doc(db, 'users', userId, 'settings', 'current'), dataToSave, { merge: true })
      return dataToSave
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path)
      return null
    }
  },

  // Trades sync
  async getTrades(userId: string, count = 100) {
    const path = `users/${userId}/trades`
    try {
      const q = query(collection(db, 'users', userId, 'trades'), orderBy('createdAt', 'desc'), limit(count))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data())
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path)
      return []
    }
  },

  async addTrade(userId: string, trade: any) {
    const tradeId = String(trade.id || `spot_${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '_')
    const path = `users/${userId}/trades/${tradeId}`
    try {
      const docData = {
        id: tradeId,
        userId,
        symbol: String(trade.symbol || 'BTCUSDT'),
        side: trade.side === 'SELL' ? 'SELL' : 'BUY',
        amount: Number(trade.amount) || 0,
        price: Number(trade.price) || 0,
        quantity: Number(trade.quantity) || 0,
        status: String(trade.status || 'FILLED'),
        isReal: Boolean(trade.isReal),
        createdAt: trade.created_at || new Date().toISOString(),
      }
      await setDoc(doc(db, 'users', userId, 'trades', tradeId), docData)
      return docData
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path)
      return trade
    }
  },

  // Bot Trades sync
  async getBotTrades(userId: string, count = 100) {
    const path = `users/${userId}/bot_trades`
    try {
      const q = query(collection(db, 'users', userId, 'bot_trades'), orderBy('createdAt', 'desc'), limit(count))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data())
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path)
      return []
    }
  },

  async addBotTrade(userId: string, trade: any) {
    const tradeId = String(trade.id || `bot_${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '_')
    const path = `users/${userId}/bot_trades/${tradeId}`
    try {
      const docData = {
        id: tradeId,
        userId,
        symbol: String(trade.symbol || 'BTCUSDT'),
        side: trade.side === 'SELL' ? 'SELL' : 'BUY',
        amount: Number(trade.amount) || 0,
        price: Number(trade.price) || 0,
        quantity: Number(trade.quantity) || 0,
        strategy: String(trade.strategy || 'multi_layer_pro'),
        status: String(trade.status || 'FILLED'),
        isReal: Boolean(trade.isReal),
        createdAt: trade.created_at || new Date().toISOString(),
      }
      await setDoc(doc(db, 'users', userId, 'bot_trades', tradeId), docData)
      return docData
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path)
      return trade
    }
  },

  // Positions sync
  async getPositions(userId: string) {
    const path = `users/${userId}/positions`
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'positions'))
      return snap.docs.map((d) => d.data())
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path)
      return []
    }
  },

  async addPosition(userId: string, pos: any) {
    const posId = String(pos.id || `pos_${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '_')
    const path = `users/${userId}/positions/${posId}`
    try {
      const data = {
        id: posId,
        userId,
        symbol: String(pos.symbol || 'BTCUSDT'),
        baseAsset: String(pos.baseAsset || 'BTC'),
        entryPrice: Number(pos.entryPrice) || 0,
        highestPrice: Number(pos.highestPrice) || 0,
        currentPrice: Number(pos.currentPrice) || 0,
        quantity: Number(pos.quantity) || 0,
        costUsd: Number(pos.costUsd) || 0,
        currentValueUsd: Number(pos.currentValueUsd) || 0,
        trailingStopPercent: Number(pos.trailingStopPercent) || 1.8,
        stopPrice: Number(pos.stopPrice) || 0,
        unrealizedPnl: Number(pos.unrealizedPnl) || 0,
        unrealizedPnlPercent: Number(pos.unrealizedPnlPercent) || 0,
        openedAt: pos.openedAt || new Date().toISOString(),
        isStuck: Boolean(pos.isStuck),
      }
      await setDoc(doc(db, 'users', userId, 'positions', posId), data)
      return data
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path)
      return pos
    }
  },

  async removePosition(userId: string, posId: string) {
    const safeId = String(posId).replace(/[^a-zA-Z0-9_\-]/g, '_')
    const path = `users/${userId}/positions/${safeId}`
    try {
      await deleteDoc(doc(db, 'users', userId, 'positions', safeId))
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path)
    }
  },

  // Dust Logs sync
  async getDustLogs(userId: string) {
    const path = `users/${userId}/dust_logs`
    try {
      const q = query(collection(db, 'users', userId, 'dust_logs'), orderBy('createdAt', 'desc'), limit(50))
      const snap = await getDocs(q)
      return snap.docs.map((d) => d.data())
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path)
      return []
    }
  },

  async addDustLog(userId: string, log: any) {
    const logId = String(log.id || `dust_${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '_')
    const path = `users/${userId}/dust_logs/${logId}`
    try {
      const data = {
        id: logId,
        userId,
        recoveredUsdt: Number(log.recoveredUsdt) || 0,
        assetsCount: Number(log.assetsCount) || 0,
        message: String(log.message || ''),
        createdAt: log.created_at || new Date().toISOString(),
      }
      await setDoc(doc(db, 'users', userId, 'dust_logs', logId), data)
      return data
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path)
      return log
    }
  },
}
