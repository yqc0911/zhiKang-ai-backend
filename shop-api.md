# Shop 接口文档

本文档用于说明 `backend` 中商城相关接口。

## 基础说明

- Base URL: `http://localhost:3000`
- 返回格式统一为：

```json
{
  "code": 200,
  "message": "success",
  "data": []
}
```

---

## 1. 获取商品列表

### 请求地址

`GET /api/shop/products`

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| category | string | 否 | 商品分类，默认 `全部` |

### 示例请求

`GET /api/shop/products?category=维生素`

### 响应数据

`data` 为商品数组，每一项字段如下：

| 字段名 | 类型 | 说明 |
|---|---|---|
| id | number | 商品 ID |
| name | string | 商品名称 |
| category | string | 商品分类 |
| description | string | 商品描述 |
| originalPrice | string | 原价 |
| discountedPrice | string | 折后价 |
| finalPrice | string | 热促后的最终展示价 |
| discountLabel | string | 折扣标签 |
| isHotPromotion | boolean | 是否热促商品 |
| image | string | 商品图片地址 |
| tags | string[] | 商品标签 |
| score | string | 评分 |

### 响应示例

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "成人复合维生素营养片",
      "category": "维生素",
      "description": "补充日常饮食所需多种维生素与矿物质，适合健康成年人日常营养支持。",
      "originalPrice": "¥89",
      "discountedPrice": "¥78",
      "finalPrice": "¥78",
      "discountLabel": "9折",
      "isHotPromotion": false,
      "image": "https://picsum.photos/seed/vitamin-1/800/600",
      "tags": ["膳食营养补充", "非药品", "每日保健"],
      "score": "4.7"
    }
  ]
}
```

---

## 2. 数据库表结构

### `shop_products`

| 字段名 | 类型 | 说明 |
|---|---|---|
| id | integer | 主键 |
| name | text | 商品名 |
| category | text | 分类 |
| description | text | 描述 |
| original_price | text | 原价 |
| discounted_price | text | 折后价 |
| final_price | text | 最终展示价 |
| discount_label | text | 折扣标签 |
| is_hot_promotion | boolean | 是否热促 |
| image | text | 图片地址 |
| tags | text[] | 标签数组 |
| score | text | 评分 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

---

## 3. 数据初始化

商品初始化脚本位于：

`backend/shop-products.sql`

执行该脚本即可完成商品表建表与 40 条商品数据插入。

---

## 4. 现有接口清单

### `GET /api/features`
- 获取首页功能卡片列表

### `GET /api/health-reminders`
- 获取健康提醒和天气信息

### `POST /api/login`
- 用户登录

### `POST /api/register`
- 用户注册

### `POST /api/chat`
- 对话接口

### `GET /api/shop/products`
- 获取商城商品列表

---

## 5. 备注

- 商城接口仅用于健康营养类商品展示。
- 当前接口返回的是展示数据，不包含真实下单、支付、库存扣减能力。
- 若后续新增商品详情、分页、搜索接口，应在本文档同步补充。
