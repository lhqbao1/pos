import { Dish } from "../dish/type"
import { Table } from "../tables/type"

export interface Order {
    id?: number,
    documentId?: string,
    table_id?: Table
    order_status: string
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    is_paid: boolean;
    paid_time?: Date
    total_amount?: number
}

export interface OrderItems {
    dish_id: Dish
    order_id: Order
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
}
