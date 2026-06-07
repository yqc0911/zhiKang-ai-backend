import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import userRouter from './user.js'
import featureRouter from './feature.js'
import chatRouter from './chat.js'
import shopRouter, { seedShopProducts } from './shop.js'
import healthRouter from './health.js'
import { ensureDatabaseSchema, testDatabaseConnection } from './db.js'

const app = express()

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-App-Version'],
    credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use('/api', userRouter)
app.use('/api/features', featureRouter)
app.use('/api', chatRouter)
app.use('/api', healthRouter)
app.use('/api', shopRouter)

// Initialize database on first request
let dbInitialized = false
const initDatabase = async () => {
    if (dbInitialized) return
    try {
        await testDatabaseConnection()
        await ensureDatabaseSchema()
        await seedShopProducts()
        console.log('PostgreSQL connected successfully')
        dbInitialized = true
    } catch (error) {
        console.warn('PostgreSQL connection failed:', error)
    }
}

// Middleware to ensure database is initialized
app.use(async (_req, _res, next) => {
    await initDatabase()
    next()
})

// Root path handler
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: '👋 欢迎使用智康AI后端服务！',
        version: '1.0.0',
        endpoints: {
            auth: {
                login: 'POST /api/login',
                register: 'POST /api/register',
            },
            features: {
                list: 'GET /api/features',
            },
            chat: {
                ai: 'POST /api/chat',
                stream: 'POST /api/chat/stream',
            },
            health: {
                reminders: 'GET /api/health/reminders',
            },
            shop: {
                products: 'GET /api/shop/products',
                categories: 'GET /api/shop/categories',
            },
        },
        documentation: '访问 /api 路径使用服务',
    })
})

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000
    app.listen(PORT, () => {
        console.log(`服务器已成功启动，正在监听 http://localhost:${PORT}`)
    })
}

export default app
