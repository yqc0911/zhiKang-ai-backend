import { Pool } from 'pg'

type DbConfig = {
    host: string
    port: number
    database: string
    user: string
    password: string
    ssl: boolean
}

const getDbConfig = (): DbConfig => {
    const port = Number(process.env.PGPORT || process.env.POSTGRES_PORT || 5432)

    return {
        host: process.env.PGHOST || process.env.POSTGRES_HOST || 'localhost',
        port: Number.isFinite(port) ? port : 5432,
        database: process.env.PGDATABASE || process.env.POSTGRES_DATABASE || 'postgres',
        user: process.env.PGUSER || process.env.POSTGRES_USER || process.env.USER || 'postgres',
        password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || 'postgres',
        ssl: process.env.PGSSL === 'true' || !!process.env.POSTGRES_URL,
    }
}

const config = getDbConfig()

// Vercel Postgres provides POSTGRES_URL, use it if available
export const pool = new Pool(
    process.env.POSTGRES_URL
        ? {
              connectionString: process.env.POSTGRES_URL,
              ssl: {
                  rejectUnauthorized: false,
              },
          }
        : {
              host: config.host,
              port: config.port,
              database: config.database,
              user: config.user,
              password: config.password,
              ssl: config.ssl ? { rejectUnauthorized: false } : false,
          }
)

export const ensureDatabaseSchema = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'user',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `)

    await pool.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL DEFAULT '',
            gender TEXT NOT NULL DEFAULT '',
            birthday DATE,
            height TEXT NOT NULL DEFAULT '',
            weight TEXT NOT NULL DEFAULT '',
            avatar_url TEXT NOT NULL DEFAULT '',
            consultation_summaries JSONB NOT NULL DEFAULT '[]'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `)
    await pool.query(`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS consultation_summaries JSONB NOT NULL DEFAULT '[]'::jsonb`)

    await pool.query(`
        CREATE TABLE IF NOT EXISTS chat_threads (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL DEFAULT '新对话',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `)

    await pool.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            thread_id TEXT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            image TEXT NOT NULL DEFAULT '',
            body_part TEXT NOT NULL DEFAULT '',
            timestamp BIGINT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `)

    await pool.query(`
        CREATE TABLE IF NOT EXISTS login_activities (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            login_date DATE NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (user_id, login_date)
        )
    `)

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_threads_user_updated ON chat_threads(user_id, updated_at DESC)
    `)

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_timestamp ON chat_messages(thread_id, timestamp ASC)
    `)

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_login_activities_user_date ON login_activities(user_id, login_date DESC)
    `)

    await pool.query(`
        CREATE TABLE IF NOT EXISTS shop_products (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            original_price TEXT NOT NULL,
            discounted_price TEXT NOT NULL,
            final_price TEXT NOT NULL,
            discount_label TEXT NOT NULL,
            is_hot_promotion BOOLEAN NOT NULL DEFAULT FALSE,
            image TEXT NOT NULL,
            tags TEXT[] NOT NULL DEFAULT '{}',
            score TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `)

    await pool.query(`
        CREATE TABLE IF NOT EXISTS shop_categories (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `)
}

export const testDatabaseConnection = async () => {
    const result = await pool.query('SELECT NOW() AS now')
    return result.rows[0]?.now
}

export const closeDatabaseConnection = async () => {
    await pool.end()
}
