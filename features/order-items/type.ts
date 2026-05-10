import { Dish } from "../dish/type"
import { Order } from "../order/type"

export type KitchenStatus = "pending" | "preparing" | "served" | "cancelled";

export interface OrderItem {
  id?: number;
  documentId?: string,
  dish_id: string | Dish;
  order_id: string | Order;
  quantity: number;
  price_at_order: number;
  line_total?: number;
  discount_amount?: number;
  dish_name_snapshot?: string;
  dish_sku_snapshot?: string;
  note?: string;
  kitchen_status?: KitchenStatus;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}
