import { Router } from 'express'

const router = Router()

interface FeatureCard {
    key: string
    title: string
    description: string
    image: string
    icon: string
    tags: string[]
    path: string
    accent: string
}

const featureCards: FeatureCard[] = [
    {
        key: 'health-ai',
        title: '智能症状分析',
        description: '基于千万级临床案例，AI快速识别潜在风险，为您提供初步分诊建议与健康指导。',
        image: 'https://picsum.photos/seed/health-ai/900/600',
        icon: 'mind',
        tags: ['智能对话', '症状分析', '快速响应'],
        path: '/health-ai',
        accent: 'from-blue-600 to-cyan-500',
    },
    {
        key: 'symptom-self-check',
        title: '症状自查',
        description: '通过症状标签快速筛查风险，并给出进一步处理建议。',
        image: 'https://picsum.photos/seed/symptom-check/900/600',
        icon: 'search',
        tags: ['风险识别', '标签筛选', '自查建议'],
        path: '/symptom-self-check',
        accent: 'from-emerald-500 to-teal-500',
    },
    {
        key: 'health-records',
        title: '健康档案',
        description: '集中管理你的健康数据，让问诊与记录更连续。',
        image: 'https://picsum.photos/seed/health-records/900/600',
        icon: 'heart',
        tags: ['档案管理', '长期追踪', '健康画像'],
        path: '/profile',
        accent: 'from-rose-500 to-pink-500',
    },
    {
        key: 'health-tips',
        title: '健康科普',
        description: '精选权威健康知识，持续更新日常保健内容。',
        image: 'https://picsum.photos/seed/health-tips/900/600',
        icon: 'read',
        tags: ['科普内容', '生活方式', '权威建议'],
        path: '/health-tips',
        accent: 'from-violet-500 to-indigo-500',
    },
    {
        key: 'mall-intro',
        title: '健康商城',
        description: '汇集精选健康好物，支持便捷选购与健康生活补给。',
        image: 'https://picsum.photos/seed/health-mall/900/600',
        icon: 'shop',
        tags: ['精选好物', '便捷选购', '健康补给'],
        path: '/shop',
        accent: 'from-amber-500 to-orange-500',
    },
]

router.get('/', (req, res) => {
    res.json({
        code: 200,
        message: 'success',
        data: featureCards,
    })
})

export default router
