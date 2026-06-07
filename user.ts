import { NextFunction, Request, Response, Router } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from './db.js'

const userRouter = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key'
const JWT_EXPIRES_IN = '30m'

type AuthUser = {
    id: number
    username: string
    password: string
    role: string | null
}

type ConsultationSummary = {
    id: string
    title: string
    summary: string
    messageCount: number
    archivedAt: string
}

type ProfileRow = {
    user_id: number
    username: string
    name: string | null
    gender: string | null
    birthday: string | Date | null
    height: string | null
    weight: string | null
    avatar_url: string | null
    consultation_summaries: ConsultationSummary[] | string | null
}

type AuthRequest = Request & {
    user?: {
        username: string
        role: string
    }
}

const signToken = (payload: { username: string; role?: string }) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
        issuer: 'backend',
    })
}

const formatBirthday = (birthday: ProfileRow['birthday']) => {
    if (!birthday) return ''
    if (birthday instanceof Date) return birthday.toISOString().slice(0, 10)
    return String(birthday).slice(0, 10)
}

const parseConsultationSummaries = (value: ProfileRow['consultation_summaries']): ConsultationSummary[] => {
    if (!value) return []
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as ConsultationSummary[]
        } catch {
            return []
        }
    }
    return value
}

const mapProfileRow = (row: ProfileRow) => ({
    userId: row.user_id,
    username: row.username,
    name: row.name || row.username,
    gender: row.gender || '男',
    birthday: formatBirthday(row.birthday) || '1998-05-18',
    height: row.height || '172',
    weight: row.weight || '68',
    avatarUrl: row.avatar_url || '',
    consultationSummaries: parseConsultationSummaries(row.consultation_summaries),
})

const getCurrentDateString = () => new Date().toISOString().slice(0, 10)

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : ''

    if (!token) {
        return res.status(401).json({
            code: 401,
            message: '请先登录',
            data: null,
        })
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET, { issuer: 'backend' }) as { username?: string; role?: string }
        if (!decoded.username) {
            return res.status(401).json({
                code: 401,
                message: '登录状态无效',
                data: null,
            })
        }

        req.user = {
            username: decoded.username,
            role: decoded.role || 'user',
        }
        next()
    } catch {
        return res.status(401).json({
            code: 401,
            message: '登录已过期，请重新登录',
            data: null,
        })
    }
}

userRouter.get('/db-health', async (_req, res) => {
    try {
        const result = await pool.query('SELECT NOW() AS now')
        res.json({
            code: 200,
            message: '数据库连接成功',
            data: result.rows[0],
        })
    } catch (error) {
        console.error('Database connection failed:', error)
        res.status(500).json({
            code: 500,
            message: '数据库连接失败',
            data: null,
        })
    }
})

userRouter.post('/login', async (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string }

    if (!username || !password) {
        return res.status(400).json({
            code: 400,
            message: '用户名和密码不能为空',
            data: null,
        })
    }

    try {
        const { rows } = await pool.query<AuthUser>(
            'SELECT id, username, password, role FROM users WHERE username = $1 AND password = $2 LIMIT 1',
            [username, password]
        )

        const user = rows[0]
        if (!user) {
            return res.status(401).json({
                code: 401,
                message: '账号或密码错误',
                data: null,
            })
        }

        const loginDate = getCurrentDateString()
        await pool.query(
            `INSERT INTO login_activities (user_id, login_date)
             VALUES ($1, $2)
             ON CONFLICT (user_id, login_date) DO NOTHING`,
            [user.id, loginDate]
        )

        await pool.query(
            `INSERT INTO user_profiles (user_id, name)
             VALUES ($1, $2)
             ON CONFLICT (user_id) DO NOTHING`,
            [user.id, user.username]
        )

        const token = signToken({ username: user.username, role: user.role || 'user' })

        return res.json({
            code: 200,
            message: '登录成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role || 'user',
                },
            },
        })
    } catch (error) {
        console.error('Login query failed:', error)
        return res.status(500).json({
            code: 500,
            message: '登录失败，数据库查询异常',
            data: null,
        })
    }
})

userRouter.post('/register', async (req, res) => {
    const { name, phone, password } = req.body as { name?: string; phone?: string; password?: string }

    if (!name || !phone || !password) {
        return res.status(400).json({
            code: 400,
            message: '姓名、手机号和密码不能为空',
            data: null,
        })
    }

    try {
        const exists = await pool.query('SELECT id FROM users WHERE username = $1 LIMIT 1', [phone])
        if (exists.rowCount && exists.rowCount > 0) {
            return res.json({
                code: 409,
                message: '该手机号已注册',
                data: null,
            })
        }

        const inserted = await pool.query<AuthUser>(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, password, role',
            [phone, password, 'user']
        )

        const user = inserted.rows[0]
        await pool.query(
            `INSERT INTO user_profiles (user_id, name)
             VALUES ($1, $2)
             ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
            [user.id, name]
        )

        const token = signToken({ username: user.username, role: user.role || 'user' })

        return res.status(201).json({
            code: 201,
            message: '注册成功',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    name,
                    role: user.role || 'user',
                },
            },
        })
    } catch (error) {
        console.error('Register failed:', error)
        return res.status(500).json({
            code: 500,
            message: '注册失败，数据库写入异常',
            data: null,
        })
    }
})

userRouter.get('/profile', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userResult = await pool.query<{ id: number; username: string }>(
            'SELECT id, username FROM users WHERE username = $1 LIMIT 1',
            [req.user?.username]
        )
        const user = userResult.rows[0]

        if (!user) {
            return res.status(404).json({
                code: 404,
                message: '用户不存在',
                data: null,
            })
        }

        await pool.query(
            `INSERT INTO user_profiles (user_id, name)
             VALUES ($1, $2)
             ON CONFLICT (user_id) DO NOTHING`,
            [user.id, user.username]
        )

        const profileResult = await pool.query<ProfileRow>(
            `SELECT
                u.id AS user_id,
                u.username,
                p.name,
                p.gender,
                p.birthday,
                p.height,
                p.weight,
                p.avatar_url,
                p.consultation_summaries
             FROM users u
             LEFT JOIN user_profiles p ON p.user_id = u.id
             WHERE u.id = $1
             LIMIT 1`,
            [user.id]
        )

        return res.json({
            code: 200,
            message: '获取个人档案成功',
            data: mapProfileRow(profileResult.rows[0]),
        })
    } catch (error) {
        console.error('Get profile failed:', error)
        return res.status(500).json({
            code: 500,
            message: '获取个人档案失败',
            data: null,
        })
    }
})

userRouter.get('/profile/consultations', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userResult = await pool.query<{ id: number }>('SELECT id FROM users WHERE username = $1 LIMIT 1', [req.user?.username])
        const user = userResult.rows[0]
        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在', data: null })
        }

        const result = await pool.query<{ consultation_summaries: ConsultationSummary[] | string | null }>(
            'SELECT consultation_summaries FROM user_profiles WHERE user_id = $1 LIMIT 1',
            [user.id]
        )

        return res.json({
            code: 200,
            message: '获取问诊摘要成功',
            data: parseConsultationSummaries(result.rows[0]?.consultation_summaries),
        })
    } catch (error) {
        console.error('Get consultations failed:', error)
        return res.status(500).json({ code: 500, message: '获取问诊摘要失败', data: null })
    }
})

userRouter.post('/profile/consultations', authMiddleware, async (req: AuthRequest, res) => {
    const payload = req.body as Partial<ConsultationSummary>
    if (!payload.id || !payload.title || !payload.summary) {
        return res.status(400).json({ code: 400, message: '问诊摘要参数错误', data: null })
    }

    try {
        const userResult = await pool.query<{ id: number }>('SELECT id FROM users WHERE username = $1 LIMIT 1', [req.user?.username])
        const user = userResult.rows[0]
        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在', data: null })
        }

        const current = await pool.query<{ consultation_summaries: ConsultationSummary[] | string | null }>(
            'SELECT consultation_summaries FROM user_profiles WHERE user_id = $1 LIMIT 1',
            [user.id]
        )
        const existing = parseConsultationSummaries(current.rows[0]?.consultation_summaries)
        const next = [
            {
                id: payload.id,
                title: payload.title,
                summary: payload.summary,
                messageCount: Number(payload.messageCount || 0),
                archivedAt: payload.archivedAt || new Date().toISOString(),
            },
            ...existing.filter((item) => item.id !== payload.id),
        ]

        await pool.query(
            `UPDATE user_profiles
             SET consultation_summaries = $2::jsonb, updated_at = NOW()
             WHERE user_id = $1`,
            [user.id, JSON.stringify(next)]
        )

        return res.json({ code: 200, message: '保存问诊摘要成功', data: next })
    } catch (error) {
        console.error('Save consultations failed:', error)
        return res.status(500).json({ code: 500, message: '保存问诊摘要失败', data: null })
    }
})

userRouter.get('/login-stats', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userResult = await pool.query<{ id: number }>(
            'SELECT id FROM users WHERE username = $1 LIMIT 1',
            [req.user?.username]
        )
        const user = userResult.rows[0]

        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在', data: null })
        }

        const loginStats = await pool.query<{ count: string }>(
            `SELECT COUNT(*)::text AS count
             FROM login_activities
             WHERE user_id = $1
               AND login_date >= DATE_TRUNC('month', CURRENT_DATE)::date`,
            [user.id]
        )

        return res.json({
            code: 200,
            message: '获取登录统计成功',
            data: {
                activeDays: Number(loginStats.rows[0]?.count || 0),
            },
        })
    } catch (error) {
        console.error('Get login stats failed:', error)
        return res.status(500).json({ code: 500, message: '获取登录统计失败', data: null })
    }
})

userRouter.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
    const { name, gender, birthday, height, weight, avatarUrl } = req.body as {
        name?: string
        gender?: string
        birthday?: string
        height?: string
        weight?: string
        avatarUrl?: string
    }

    if (!name || !gender || !birthday || !height || !weight) {
        return res.status(400).json({
            code: 400,
            message: '姓名、性别、生日、身高和体重不能为空',
            data: null,
        })
    }

    try {
        const userResult = await pool.query<{ id: number; username: string }>(
            'SELECT id, username FROM users WHERE username = $1 LIMIT 1',
            [req.user?.username]
        )
        const user = userResult.rows[0]

        if (!user) {
            return res.status(404).json({
                code: 404,
                message: '用户不存在',
                data: null,
            })
        }

        const profileResult = await pool.query<ProfileRow>(
            `INSERT INTO user_profiles (user_id, name, gender, birthday, height, weight, avatar_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id) DO UPDATE SET
                name = EXCLUDED.name,
                gender = EXCLUDED.gender,
                birthday = EXCLUDED.birthday,
                height = EXCLUDED.height,
                weight = EXCLUDED.weight,
                avatar_url = EXCLUDED.avatar_url,
                updated_at = NOW()
             RETURNING user_id, $8::TEXT AS username, name, gender, birthday, height, weight, avatar_url, consultation_summaries`,
            [user.id, name, gender, birthday, height, weight, avatarUrl || '', user.username]
        )

        return res.json({
            code: 200,
            message: '个人档案保存成功',
            data: mapProfileRow(profileResult.rows[0]),
        })
    } catch (error) {
        console.error('Update profile failed:', error)
        return res.status(500).json({
            code: 500,
            message: '个人档案保存失败',
            data: null,
        })
    }
})

userRouter.delete('/profile/consultations/:id', authMiddleware, async (req: AuthRequest, res) => {
    const id = req.params.id
    if (!id) {
        return res.status(400).json({ code: 400, message: '问诊记录ID不能为空', data: null })
    }

    try {
        const userResult = await pool.query<{ id: number }>('SELECT id FROM users WHERE username = $1 LIMIT 1', [req.user?.username])
        const user = userResult.rows[0]
        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在', data: null })
        }

        const current = await pool.query<{ consultation_summaries: ConsultationSummary[] | string | null }>(
            'SELECT consultation_summaries FROM user_profiles WHERE user_id = $1 LIMIT 1',
            [user.id]
        )
        const existing = parseConsultationSummaries(current.rows[0]?.consultation_summaries)
        const next = existing.filter((item) => item.id !== id)

        await pool.query(
            `UPDATE user_profiles
             SET consultation_summaries = $2::jsonb, updated_at = NOW()
             WHERE user_id = $1`,
            [user.id, JSON.stringify(next)]
        )

        return res.json({ code: 200, message: '删除问诊记录成功', data: next })
    } catch (error) {
        console.error('Delete consultation failed:', error)
        return res.status(500).json({ code: 500, message: '删除问诊记录失败', data: null })
    }
})

export default userRouter
