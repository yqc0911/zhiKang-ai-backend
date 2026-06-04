BEGIN;

CREATE TABLE IF NOT EXISTS shop_categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
);

INSERT INTO shop_categories (name, sort_order) VALUES
('全部', 0),
('维生素', 1),
('钙片', 2),
('蛋白营养', 3),
('益生菌', 4),
('日常保健', 5)
ON CONFLICT (name) DO NOTHING;

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
(8, '儿童成长钙营养片', '钙片', '针对儿童日常钙营养补充设计，建议在成人指导下按说明使用。', '¥108', '¥86', '¥86', '8折', FALSE, 'https://picsum.photos/seed/kids-calcium-8/800/600', ARRAY['儿童营养','钙补充','非药品'], '4.6'),
(9, '成人复合维生素营养片 2代', '维生素', '补充日常饮食所需多种维生素与矿物质，适合健康成年人日常营养支持。', '¥95', '¥81', '¥81', '9折', FALSE, 'https://picsum.photos/seed/vitamin-9/800/600', ARRAY['膳食营养补充','非药品','每日保健'], '4.7'),
(10, '中老年钙维D营养片 2代', '钙片', '钙与维生素D科学搭配，辅助补充骨骼健康所需营养，不替代药物治疗。', '¥134', '¥107', '¥86', '8折', TRUE, 'https://picsum.photos/seed/calcium-10/800/600', ARRAY['钙营养','含维D','非药品'], '4.8'),
(11, '高蛋白营养粉 2代', '蛋白营养', '适合运动、恢复期营养补充及日常蛋白摄入不足人群，口感细腻易冲泡。', '¥175', '¥140', '¥140', '8折', FALSE, 'https://picsum.photos/seed/protein-11/800/600', ARRAY['蛋白补充','营养支持','非药品'], '4.9'),
(12, '益生菌冻干粉 2代', '益生菌', '多菌株配方，帮助维持肠道菌群平衡，适合作为日常健康管理补充。', '¥105', '¥80', '¥80', '8折', FALSE, 'https://picsum.photos/seed/probiotic-12/800/600', ARRAY['肠道健康','独立包装','非药品'], '4.6'),
(13, '蓝莓叶黄素酯片 2代', '日常保健', '含叶黄素酯与蓝莓提取物，适合长时间用眼人群作为日常营养补充。', '¥125', '¥109', '¥109', '9折', FALSE, 'https://picsum.photos/seed/lutein-13/800/600', ARRAY['护眼营养','蓝莓配方','非药品'], '4.7'),
(14, '鱼油软胶囊 2代', '日常保健', '富含不饱和脂肪酸，适合作为日常膳食脂肪酸补充来源。', '¥145', '¥116', '¥116', '9折', FALSE, 'https://picsum.photos/seed/fish-oil-14/800/600', ARRAY['脂肪酸补充','软胶囊','非药品'], '4.8'),
(15, '维生素C咀嚼片 2代', '维生素', '酸甜口感，帮助补充日常维生素C摄入，适合办公与家庭常备。', '¥65', '¥52', '¥42', '8折', TRUE, 'https://picsum.photos/seed/vitamin-c-15/800/600', ARRAY['维C补充','咀嚼片','非药品'], '4.9'),
(16, '儿童成长钙营养片 2代', '钙片', '针对儿童日常钙营养补充设计，建议在成人指导下按说明使用。', '¥114', '¥91', '¥91', '8折', FALSE, 'https://picsum.photos/seed/kids-calcium-16/800/600', ARRAY['儿童营养','钙补充','非药品'], '4.6'),
(17, '成人复合维生素营养片 3代', '维生素', '补充日常饮食所需多种维生素与矿物质，适合健康成年人日常营养支持。', '¥101', '¥81', '¥81', '8折', FALSE, 'https://picsum.photos/seed/vitamin-17/800/600', ARRAY['膳食营养补充','非药品','每日保健'], '4.7'),
(18, '中老年钙维D营养片 3代', '钙片', '钙与维生素D科学搭配，辅助补充骨骼健康所需营养，不替代药物治疗。', '¥140', '¥119', '¥119', '9折', FALSE, 'https://picsum.photos/seed/calcium-18/800/600', ARRAY['钙营养','含维D','非药品'], '4.8'),
(19, '高蛋白营养粉 3代', '蛋白营养', '适合运动、恢复期营养补充及日常蛋白摄入不足人群，口感细腻易冲泡。', '¥181', '¥145', '¥145', '8折', FALSE, 'https://picsum.photos/seed/protein-19/800/600', ARRAY['蛋白补充','营养支持','非药品'], '4.9'),
(20, '益生菌冻干粉 3代', '益生菌', '多菌株配方，帮助维持肠道菌群平衡，适合作为日常健康管理补充。', '¥111', '¥89', '¥71', '8折', TRUE, 'https://picsum.photos/seed/probiotic-20/800/600', ARRAY['肠道健康','独立包装','非药品'], '4.6'),
(21, '蓝莓叶黄素酯片 3代', '日常保健', '含叶黄素酯与蓝莓提取物，适合长时间用眼人群作为日常营养补充。', '¥131', '¥104', '¥104', '8折', FALSE, 'https://picsum.photos/seed/lutein-21/800/600', ARRAY['护眼营养','蓝莓配方','非药品'], '4.7'),
(22, '鱼油软胶囊 3代', '日常保健', '富含不饱和脂肪酸，适合作为日常膳食脂肪酸补充来源。', '¥151', '¥121', '¥121', '8折', FALSE, 'https://picsum.photos/seed/fish-oil-22/800/600', ARRAY['脂肪酸补充','软胶囊','非药品'], '4.8'),
(23, '维生素C咀嚼片 3代', '维生素', '酸甜口感，帮助补充日常维生素C摄入，适合办公与家庭常备。', '¥71', '¥57', '¥57', '8折', FALSE, 'https://picsum.photos/seed/vitamin-c-23/800/600', ARRAY['维C补充','咀嚼片','非药品'], '4.9'),
(24, '儿童成长钙营养片 3代', '钙片', '针对儿童日常钙营养补充设计，建议在成人指导下按说明使用。', '¥120', '¥96', '¥96', '8折', FALSE, 'https://picsum.photos/seed/kids-calcium-24/800/600', ARRAY['儿童营养','钙补充','非药品'], '4.6'),
(25, '成人复合维生素营养片 4代', '维生素', '补充日常饮食所需多种维生素与矿物质，适合健康成年人日常营养支持。', '¥107', '¥75', '¥60', '8折', TRUE, 'https://picsum.photos/seed/vitamin-25/800/600', ARRAY['膳食营养补充','非药品','每日保健'], '4.7'),
(26, '中老年钙维D营养片 4代', '钙片', '钙与维生素D科学搭配，辅助补充骨骼健康所需营养，不替代药物治疗。', '¥146', '¥124', '¥124', '8折', FALSE, 'https://picsum.photos/seed/calcium-26/800/600', ARRAY['钙营养','含维D','非药品'], '4.8'),
(27, '高蛋白营养粉 4代', '蛋白营养', '适合运动、恢复期营养补充及日常蛋白摄入不足人群，口感细腻易冲泡。', '¥187', '¥150', '¥150', '8折', FALSE, 'https://picsum.photos/seed/protein-27/800/600', ARRAY['蛋白补充','营养支持','非药品'], '4.9'),
(28, '益生菌冻干粉 4代', '益生菌', '多菌株配方，帮助维持肠道菌群平衡，适合作为日常健康管理补充。', '¥117', '¥88', '¥88', '8折', FALSE, 'https://picsum.photos/seed/probiotic-28/800/600', ARRAY['肠道健康','独立包装','非药品'], '4.6'),
(29, '蓝莓叶黄素酯片 4代', '日常保健', '含叶黄素酯与蓝莓提取物，适合长时间用眼人群作为日常营养补充。', '¥137', '¥110', '¥110', '8折', FALSE, 'https://picsum.photos/seed/lutein-29/800/600', ARRAY['护眼营养','蓝莓配方','非药品'], '4.7'),
(30, '鱼油软胶囊 4代', '日常保健', '富含不饱和脂肪酸，适合作为日常膳食脂肪酸补充来源。', '¥157', '¥126', '¥101', '8折', TRUE, 'https://picsum.photos/seed/fish-oil-30/800/600', ARRAY['脂肪酸补充','软胶囊','非药品'], '4.8'),
(31, '维生素C咀嚼片 4代', '维生素', '酸甜口感，帮助补充日常维生素C摄入，适合办公与家庭常备。', '¥77', '¥62', '¥62', '8折', FALSE, 'https://picsum.photos/seed/vitamin-c-31/800/600', ARRAY['维C补充','咀嚼片','非药品'], '4.9'),
(32, '儿童成长钙营养片 4代', '钙片', '针对儿童日常钙营养补充设计，建议在成人指导下按说明使用。', '¥126', '¥95', '¥95', '8折', FALSE, 'https://picsum.photos/seed/kids-calcium-32/800/600', ARRAY['儿童营养','钙补充','非药品'], '4.6'),
(33, '成人复合维生素营养片 5代', '维生素', '补充日常饮食所需多种维生素与矿物质，适合健康成年人日常营养支持。', '¥113', '¥90', '¥90', '8折', FALSE, 'https://picsum.photos/seed/vitamin-33/800/600', ARRAY['膳食营养补充','非药品','每日保健'], '4.7'),
(34, '中老年钙维D营养片 5代', '钙片', '钙与维生素D科学搭配，辅助补充骨骼健康所需营养，不替代药物治疗。', '¥152', '¥121', '¥121', '8折', FALSE, 'https://picsum.photos/seed/calcium-34/800/600', ARRAY['钙营养','含维D','非药品'], '4.8'),
(35, '高蛋白营养粉 5代', '蛋白营养', '适合运动、恢复期营养补充及日常蛋白摄入不足人群，口感细腻易冲泡。', '¥193', '¥135', '¥108', '8折', TRUE, 'https://picsum.photos/seed/protein-35/800/600', ARRAY['蛋白补充','营养支持','非药品'], '4.9'),
(36, '益生菌冻干粉 5代', '益生菌', '多菌株配方，帮助维持肠道菌群平衡，适合作为日常健康管理补充。', '¥123', '¥105', '¥105', '9折', FALSE, 'https://picsum.photos/seed/probiotic-36/800/600', ARRAY['肠道健康','独立包装','非药品'], '4.6'),
(37, '蓝莓叶黄素酯片 5代', '日常保健', '含叶黄素酯与蓝莓提取物，适合长时间用眼人群作为日常营养补充。', '¥143', '¥115', '¥115', '8折', FALSE, 'https://picsum.photos/seed/lutein-37/800/600', ARRAY['护眼营养','蓝莓配方','非药品'], '4.7'),
(38, '鱼油软胶囊 5代', '日常保健', '富含不饱和脂肪酸，适合作为日常膳食脂肪酸补充来源。', '¥163', '¥130', '¥130', '8折', FALSE, 'https://picsum.photos/seed/fish-oil-38/800/600', ARRAY['脂肪酸补充','软胶囊','非药品'], '4.8'),
(39, '维生素C咀嚼片 5代', '维生素', '酸甜口感，帮助补充日常维生素C摄入，适合办公与家庭常备。', '¥83', '¥66', '¥66', '8折', FALSE, 'https://picsum.photos/seed/vitamin-c-39/800/600', ARRAY['维C补充','咀嚼片','非药品'], '4.9'),
(40, '儿童成长钙营养片 5代', '钙片', '针对儿童日常钙营养补充设计，建议在成人指导下按说明使用。', '¥132', '¥106', '¥85', '8折', TRUE, 'https://picsum.photos/seed/kids-calcium-40/800/600', ARRAY['儿童营养','钙补充','非药品'], '4.6')
ON CONFLICT (id) DO NOTHING;

COMMIT;
