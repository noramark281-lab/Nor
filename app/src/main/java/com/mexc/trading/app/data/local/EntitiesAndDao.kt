package com.mexc.trading.app.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "bots")
data class BotEntity(
    @PrimaryKey val id: String,
    val name: String,
    val type: String,
    val symbol: String,
    val enabled: Boolean,
    val leverage: Int,
    val allocatedMargin: Double,
    val lowerPrice: Double?,
    val upperPrice: Double?,
    val gridCount: Int?,
    val dcaStepPercent: Double?,
    val dcaMultiplier: Double?,
    val maxDcaSteps: Int?,
    val takeProfitPercent: Double,
    val stopLossPercent: Double,
    val maxPositions: Int,
    val totalTrades: Int,
    val winningTrades: Int,
    val profitUsdt: Double,
    val status: String,
    val lastRunTimestamp: Long?
)

@Entity(tableName = "bot_logs")
data class LogEntity(
    @PrimaryKey val id: String,
    val timestamp: Long,
    val strategyName: String,
    val symbol: String,
    val level: String,
    val message: String
)

@Entity(tableName = "positions")
data class PositionEntity(
    @PrimaryKey val id: String,
    val symbol: String,
    val side: String,
    val size: Double,
    val entryPrice: Double,
    val markPrice: Double,
    val liquidationPrice: Double,
    val margin: Double,
    val leverage: Int,
    val unrealizedPnL: Double,
    val unrealizedPnLPercent: Double,
    val tpPrice: Double?,
    val slPrice: Double?,
    val createdAt: Long
)

@Entity(tableName = "credentials")
data class CredentialsEntity(
    @PrimaryKey val id: Int = 1,
    val apiKey: String,
    val secretKey: String,
    val isConfigured: Boolean,
    val isValidated: Boolean
)

@Entity(tableName = "account_state")
data class AccountEntity(
    @PrimaryKey val currency: String = "USDT",
    val equity: Double,
    val availableBalance: Double,
    val positionMargin: Double,
    val frozenBalance: Double,
    val unrealizedPnL: Double,
    val unrealizedPnLPercent: Double
)

@Dao
interface BotDao {
    @Query("SELECT * FROM bots ORDER BY lastRunTimestamp DESC")
    fun getAllBots(): Flow<List<BotEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBot(bot: BotEntity)

    @Update
    suspend fun updateBot(bot: BotEntity)

    @Query("DELETE FROM bots WHERE id = :id")
    suspend fun deleteBotById(id: String)
}

@Dao
interface LogDao {
    @Query("SELECT * FROM bot_logs ORDER BY timestamp DESC LIMIT 100")
    fun getLogs(): Flow<List<LogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: LogEntity)

    @Query("DELETE FROM bot_logs")
    suspend fun clearLogs()
}

@Dao
interface PositionDao {
    @Query("SELECT * FROM positions ORDER BY createdAt DESC")
    fun getPositions(): Flow<List<PositionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPosition(position: PositionEntity)

    @Query("DELETE FROM positions WHERE id = :id")
    suspend fun deletePosition(id: String)

    @Query("DELETE FROM positions")
    suspend fun deleteAllPositions()
}

@Dao
interface CredentialsDao {
    @Query("SELECT * FROM credentials WHERE id = 1")
    fun getCredentials(): Flow<CredentialsEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveCredentials(credentials: CredentialsEntity)
}

@Dao
interface AccountDao {
    @Query("SELECT * FROM account_state WHERE currency = 'USDT'")
    fun getAccount(): Flow<AccountEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveAccount(account: AccountEntity)
}

@Database(
    entities = [
        BotEntity::class,
        LogEntity::class,
        PositionEntity::class,
        CredentialsEntity::class,
        AccountEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun botDao(): BotDao
    abstract fun logDao(): LogDao
    abstract fun positionDao(): PositionDao
    abstract fun credentialsDao(): CredentialsDao
    abstract fun accountDao(): AccountDao
}
