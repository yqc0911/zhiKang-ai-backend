import { Router } from 'express'
import { pool } from './db'

const router = Router()

export interface ShopProductRow {
    id: number
    name: string
    category: string
    description: string
    original_price: string
    discounted_price: string
    final_price: string
    discount_label: string
    is_hot_promotion: boolean
    image: string
    tags: string[]
    score: string
}

const seedProductsSql = `
INSERT INTO shop_products (
    id,
    name,
    category,
    description,
    original_price,
    discounted_price,
    final_price,
    discount_label,
    is_hot_promotion,
    image,
    tags,
    score
) VALUES
(1, '成人复合维生素营养片', '维生素', '补充日常饮食所需多种维生素与矿物质，适合健康成年人日常营养支持。', '¥89', '¥78', '¥78', '9折', FALSE, 'https://picsum.photos/seed/vitamin-1/800/600', ARRAY['膳食营养补充','非药品','每日保健'], '4.7'),
(2, '中老年钙维D营养片', '钙片', '钙与维生素D科学搭配，辅助补充骨骼健康所需营养，不替代药物治疗。', '¥128', '¥109', '¥109', '9折', FALSE, 'https://picsum.photos/seed/calcium-2/800/600', ARRAY['钙营养','含维D','非药品'], '4.8'),
(3, '高蛋白营养粉', '蛋白营养', '适合运动、恢复期营养补充及日常蛋白摄入不足人群，口感细腻易冲泡。', '¥169', '¥136', '¥136', '8折', FALSE, 'https://picsum.photos/seed/protein-3/800/600', ARRAY['蛋白补充','营养支持','非药品'], '4.9'),
(4, '益生菌冻干粉', '益生菌', '多菌株配方，帮助维持肠道菌群平衡，适合作为日常健康管理补充。', '¥99', '¥74', '¥74', '8折', FALSE, 'https://picsum.photos/seed/probiotic-4/800/600', ARRAY['肠道健康','独立包装','非药品'], '4.6'),
(5, '蓝莓叶黄素酯片', '日常保健', '含叶黄素酯与蓝莓提取物，适合长时间用眼人群作为日常营养补充。', '¥119', '¥83', '¥66', '8折', TRUE, 'https://picsum.photos/seed/lutein-5/800/600', ARRAY['护眼营养','蓝莓配方','非药品'], '4.7'),
(6, '鱼油软胶囊', '日常保健', '富含不饱和脂肪酸，适合作为日常膳食脂肪酸补充来源。', '¥139', '¥111', '¥111', '8折', FALSE, 'https://picsum.photos/seed/fish-oil-6/800/600', ARRAY['脂肪酸补充','软胶囊','非药品'], '4.8'),
(7, '维生素C咀嚼片', '维生素', '酸甜口感，帮助补充日常维生素C摄入，适合办公与家庭常备。', '¥59', '¥47', '¥47', '9折', FALSE, 'https://picsum.photos/seed/vitamin-c-7/800/600', ARRAY['维C补充','咀嚼片','非药品'], '4.9'),
(8, '儿童成长钙营养片', '钙片', '针对儿童日常钙营养补充设计，建议在成人指导下按说明使用。', '¥108', '¥86', '¥86', '8折', FALSE, 'https://picsum.photos/seed/kids-calcium-8/800/600', ARRAY['儿童营养','钙补充','非药品'], '4.6')
ON CONFLICT (id) DO NOTHING;
`

export const seedShopProducts = async () => {
    await pool.query(`
        INSERT INTO shop_categories (name, sort_order) VALUES
        ('全部', 0),
        ('维生素', 1),
        ('钙片', 2),
        ('蛋白营养', 3),
        ('益生菌', 4),
        ('日常保健', 5)
        ON CONFLICT (name) DO NOTHING
    `)

    await pool.query(seedProductsSql)
}

router.get('/shop/categories', async (_req, res) => {
    try {
        const result = await pool.query<{ name: string }>('SELECT name FROM shop_categories ORDER BY sort_order ASC, id ASC')

        res.json({
            code: 200,
            message: 'success',
            data: result.rows.map((row) => row.name),
        })
    } catch (error) {
        console.error('Failed to fetch shop categories:', error)
        res.status(500).json({
            code: 500,
            message: 'Failed to fetch shop categories',
            data: [],
        })
    }
})

const mapRow = (row: ShopProductRow) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    originalPrice: row.original_price,
    discountedPrice: row.discounted_price,
    finalPrice: row.final_price,
    discountLabel: row.discount_label,
    isHotPromotion: row.is_hot_promotion,
    image: row.image,
    tags: row.tags,
    score: row.score,
})

router.get('/shop/products', async (req, res) => {
    try {
        const category = typeof req.query.category === 'string' ? req.query.category : '全部'

        const result =
            category === '全部'
                ? await pool.query<ShopProductRow>('SELECT * FROM shop_products ORDER BY id ASC')
                : await pool.query<ShopProductRow>('SELECT * FROM shop_products WHERE category = $1 ORDER BY id ASC', [category])

        res.json({
            code: 200,
            message: 'success',
            data: result.rows.map(mapRow),
        })
    } catch (error) {
        console.error('Failed to fetch shop products:', error)
        res.status(500).json({
            code: 500,
            message: 'Failed to fetch shop products',
            data: [],
        })
    }
})

router.get('/shop/products/:id', async (req, res) => {
    try {
        const id = Number(req.params.id)
        if (!Number.isFinite(id)) {
            res.status(400).json({ code: 400, message: 'Invalid product id', data: null })
            return
        }

        const result = await pool.query<ShopProductRow>('SELECT * FROM shop_products WHERE id = $1 LIMIT 1', [id])
        const product = result.rows[0]

        if (!product) {
            res.status(404).json({ code: 404, message: 'Product not found', data: null })
            return
        }

        res.json({
            code: 200,
            message: 'success',
            data: mapRow(product),
        })
    } catch (error) {
        console.error('Failed to fetch product detail:', error)
        res.status(500).json({
            code: 500,
            message: 'Failed to fetch product detail',
            data: null,
        })
    }
})

export default router
