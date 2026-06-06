import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { corsMiddleware } from './corsMiddleware.js'
import userRouter from './user.js'
import featureRouter from './feature.js'
import chatRouter from './chat.js'
import shopRouter, { seedShopProducts } from './shop.js'
import healthRouter from './health.js'
import { ensureDatabaseSchema, testDatabaseConnection } from './db.js'

const app = express()

const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY || ''
const WEATHER_BASE_URL = 'https://dev.qweather.com/dev-api'

app.use(express.json({ limit: '10mb' }))
app.use(corsMiddleware)
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
app.use(async (req, res, next) => {
    await initDatabase()
    next()
})

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000
    app.listen(PORT, () => {
        console.log(`服务器已成功启动，正在监听 http://localhost:${PORT}`)
    })
}

export default app
