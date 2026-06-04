import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import express from 'express'
import { corsMiddleware } from './corsMiddleware'
import userRouter from './user'
import featureRouter from './feature'
import chatRouter from './chat'
import shopRouter, { seedShopProducts } from './shop'
import healthRouter from './health'
import { ensureDatabaseSchema, testDatabaseConnection } from './db'

const app = express()
const PORT = 3000

const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY || ''
const WEATHER_BASE_URL = 'https://dev.qweather.com/dev-api'

app.use(express.json({ limit: '10mb' }))
app.use(corsMiddleware)
app.use('/api', userRouter)
app.use('/api/features', featureRouter)
app.use('/api', chatRouter)
app.use('/api', healthRouter)
app.use('/api', shopRouter)

const startServer = async () => {
    try {
        await testDatabaseConnection()
        await ensureDatabaseSchema()
        await seedShopProducts()
        console.log('PostgreSQL connected successfully')
    } catch (error) {
        console.warn('PostgreSQL connection failed at startup:', error)
    }

    app.listen(PORT, () => {
        console.log(`服务器已成功启动，正在监听 http://localhost:${PORT}`)
    })
}

void startServer()
