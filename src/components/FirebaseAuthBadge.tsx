import React, { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { LogIn, LogOut, ShieldCheck, User as UserIcon, Cloud } from 'lucide-react';
import { auth, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { Language } from '../types';

interface FirebaseAuthBadgeProps {
  lang: Language;
}

export const FirebaseAuthBadge: React.FC<FirebaseAuthBadgeProps> = ({ lang }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isAr = lang === 'ar';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Firebase Auth Login Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Firebase Auth Logout Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs animate-pulse flex items-center gap-1.5">
        <Cloud className="w-3.5 h-3.5" />
        <span>Firebase...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs">
        <div className="flex items-center gap-1.5">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-4 h-4 rounded-full" />
          ) : (
            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="font-medium text-emerald-200 max-w-[100px] truncate hidden md:inline">
            {user.displayName || user.email || 'Firebase User'}
          </span>
          <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
            {isAr ? 'مفعل' : 'Firebase On'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          title={isAr ? 'تسجيل الخروج من سحابة Firebase' : 'Logout Firebase'}
          className="text-slate-400 hover:text-rose-400 transition-colors p-0.5"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
    >
      <LogIn className="w-3.5 h-3.5 text-emerald-400" />
      <span>{isAr ? 'دخول سحابة Firebase' : 'Firebase Cloud Sync'}</span>
    </button>
  );
};
