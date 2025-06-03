import { Dish } from "../dish/type"
import { Order } from "../order/type"

export interface OrderItem {
  id?: number;
  documentId?: string,
  dish_id: string | Dish;
  order_id: string | Order;
  quantity: number;
  price_at_order: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}