import type { Request } from 'express'
import { Router } from 'express'

const healthRouter = Router()

type QWeatherNowResponse = {
    code: string
    now?: {
        temp?: string
        text?: string
        humidity?: string
        windDir?: string
        windSpeed?: string
        precip?: string
    }
}

type IpApiResponse = {
    status: 'success' | 'fail'
    city?: string
    lat?: number
    lon?: number
    message?: string
}

type WeatherInfo = {
    temp: string
    text: string
    humidity: string
    windDir: string
    windSpeed: string
    precip: string
}

const cityToLocationId: Record<string, string> = {
    北京: '101010100',
    上海: '101020100',
    广州: '101280101',
    深圳: '101280601',
    杭州: '101210101',
    成都: '101270101',
}

const fallbackWeather: WeatherInfo = {
    temp: '--℃',
    text: '暂无数据',
    humidity: '--%',
    windDir: '--',
    windSpeed: '-- km/h',
    precip: '--mm',
}

const getClientIp = (req: Request) => {
    const forwardedFor = req.headers['x-forwarded-for']
    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim()
    }

    const remoteAddress = req.ip || req.socket.remoteAddress || ''
    return remoteAddress.replace(/^::ffff:/, '') || '127.0.0.1'
}

const normalizeCity = (city?: string) => (city && city.trim() ? city.trim() : '北京')

const buildReminders = (weatherText: string, tempText: string) => {
    const temp = Number.parseFloat(tempText.replace(/[^\d.-]/g, ''))
    const list = [
        { content: '保持规律作息，帮助维持免疫状态与精神状态。', icon: 'sleep' },
        { content: '饮食尽量清淡均衡，少油少盐少糖。', icon: 'diet' },
    ]

    const lowerText = weatherText.toLowerCase()

    if (lowerText.includes('雨') || lowerText.includes('storm')) {
        list.push({ content: '今天有降雨，外出记得携带雨具，注意路面湿滑。', icon: 'rain' })
    } else if (lowerText.includes('雪') || lowerText.includes('冰')) {
        list.push({ content: '天气较冷，外出注意保暖，尽量避免长时间受寒。', icon: 'cold' })
    } else if (lowerText.includes('晴') || lowerText.includes('热') || (Number.isFinite(temp) && temp >= 30)) {
        list.push({ content: '天气较热，注意补水并尽量避开正午高温时段外出。', icon: 'hot' })
    } else if (lowerText.includes('雾') || lowerText.includes('霾')) {
        list.push({ content: '空气能见度较低，出行注意安全，必要时佩戴口罩。', icon: 'fog' })
    } else {
        list.push({ content: '天气变化时注意增减衣物，预防着凉感冒。', icon: 'windy' })
    }

    return list
}

const toWeatherInfo = (now?: QWeatherNowResponse['now']): WeatherInfo => ({
    temp: `${now?.temp ?? '--'}℃`,
    text: now?.text ?? '未知',
    humidity: `${now?.humidity ?? '--'}%`,
    windDir: now?.windDir ?? '--',
    windSpeed: `${now?.windSpeed ?? '--'} km/h`,
    precip: `${now?.precip ?? '--'}mm`,
})

healthRouter.get('/health-reminders', async (req, res) => {
    try {
        const apiHost = process.env.QWEATHER_API_BASE || 'https://devapi.qweather.com'
        const token = process.env.QWEATHER_API_KEY

        if (!token) {
            res.status(500).json({ code: 500, message: 'QWeather API key 未配置', data: null })
            return
        }

        const clientIp = getClientIp(req)
        const ipLookup = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,city,lat,lon`)
        const ipData = (await ipLookup.json()) as IpApiResponse

        const city = normalizeCity(ipData.city)
        const locationId = cityToLocationId[city]
        const weatherUrl = new URL('/v7/weather/now', apiHost)

        if (locationId) {
            weatherUrl.searchParams.set('location', locationId)
        } else if (typeof ipData.lat === 'number' && typeof ipData.lon === 'number') {
            weatherUrl.searchParams.set('location', `${ipData.lon},${ipData.lat}`)
        } else {
            weatherUrl.searchParams.set('location', cityToLocationId.北京)
        }

        weatherUrl.searchParams.set('key', token)

        const response = await fetch(weatherUrl.toString())
        if (!response.ok) {
            const text = await response.text()
            throw new Error(`QWeather request failed: ${response.status} ${text}`)
        }

        const payload = (await response.json()) as QWeatherNowResponse
        if (payload.code !== '200') {
            throw new Error(`QWeather returned code ${payload.code}`)
        }

        const weather = toWeatherInfo(payload.now)
        res.json({
            code: 200,
            message: 'success',
            data: {
                weather,
                reminders: buildReminders(weather.text, weather.temp),
                location: city,
                clientIp,
            },
        })
    } catch (error) {
        console.error('Failed to fetch weather reminders:', error)
        res.json({
            code: 200,
            message: 'success',
            data: {
                weather: fallbackWeather,
                reminders: buildReminders(fallbackWeather.text, fallbackWeather.temp),
                location: '北京',
                clientIp: '127.0.0.1',
            },
        })
    }
})

export default healthRouter
