# POS Data Model v2

## Goals
- Fix relation cardinality for POS workflows (1 table -> many orders, 1 order -> many items).
- Separate payment records from order header.
- Add financial snapshots for easier audit/reporting.
- Reduce "empty data because unpublished" by disabling Draft/Publish on runtime collections.

## Upgraded Content Types

### `category`
- `name` (required)
- `slug` (uid)
- `description`
- `image`
- `sortOrder` (default `0`)
- `isActive` (default `true`)
- Relation: `dishes` (`oneToMany`) -> `dish.category`

### `dish`
- `name` (required)
- `slug` (uid)
- `sku` (unique)
- `description`
- `price` (required)
- `vipPrice` (default `0`)
- `costPrice` (default `0`)
- `image`
- `isActive` (default `true`)
- `sortOrder` (default `0`)
- `sold` (default `0`)
- `rating` (decimal, `0..5`)
- Relation: `category` (`manyToOne`) -> `category.dishes`
- Relation: `orderItems` (`oneToMany`) -> `order-item.dish_id`

### `table`
- `tableNumber` (required, unique)
- `displayName`
- `type` (`Normal` | `Vip`)
- `table_status` (`Empty` | `Using` | `Reserved` | `Cleaning` | `Disabled`)
- `capacity` (default `4`)
- `zone`
- `note`
- `is_active` (default `true`)
- Relation: `orders` (`oneToMany`) -> `order.table_id`

### `order`
- `order_no` (uid)
- `table_id` (`manyToOne`) -> `table.orders`
- `order_status` (`empty` | `active` | `paid` | `cancelled` | `refunded`)
- `source` (`dine_in` | `takeaway` | `delivery`)
- `guest_count` (default `1`)
- `is_paid` (default `false`)
- `opened_at`, `paid_time`, `closed_at`
- `subtotal`, `discount_amount`, `tax_amount`, `service_charge`, `total_amount`, `paid_amount`, `change_amount`
- `cashier_name`, `note`
- Relation: `items` (`oneToMany`) -> `order-item.order_id`
- Relation: `payments` (`oneToMany`) -> `payment.order_id`

### `order-item`
- `dish_id` (`manyToOne`) -> `dish.orderItems`
- `order_id` (`manyToOne`) -> `order.items`
- `quantity` (required, default `1`)
- `price_at_order` (required)
- `line_total` (default `0`)
- `discount_amount` (default `0`)
- `dish_name_snapshot`, `dish_sku_snapshot`
- `note`
- `kitchen_status` (`pending` | `preparing` | `served` | `cancelled`)

### `payment` (new)
- `order_id` (`manyToOne`) -> `order.payments` (required)
- `method` (`cash` | `card` | `bank_transfer` | `e_wallet`)
- `status` (`pending` | `success` | `failed` | `refunded`)
- `amount` (required)
- `currency` (default `VND`)
- `paid_at`
- `reference`
- `note`
- `metadata` (json)

## Compatibility Notes
- Existing frontend still uses legacy keys: `table_id`, `order_id`, `dish_id`, `price_at_order`.
- New fields are optional for now so current screens continue to work.
- `createOrderItem` now auto-fills:
  - `line_total = quantity * price_at_order`
  - `discount_amount = 0`
  - `kitchen_status = pending`

## Strapi Cloud Checklist
1. Deploy backend changes from `pos-strapi`.
2. In Strapi admin, verify public/auth permissions for:
   - `category`, `dish`, `table`, `order`, `order-item`, `payment`.
3. Rebuild frontend and ensure:
   - `NEXT_PUBLIC_STRAPI_URL` points to cloud domain (without `/admin`).
4. Test end-to-end flow:
   - Open table -> create order -> add item -> pay -> check `payments` created.
