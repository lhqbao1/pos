import { Dish } from "../dish/type"
import { Table } from "../tables/type"

export type OrderStatus =
    | "empty"
    | "active"
    | "paid"
    | "outstanding"
    | "cancelled"
    | "refunded";
export type OrderSource = "dine_in" | "takeaway" | "delivery";

export interface Order {
    id?: number,
    documentId?: string,
    order_no?: string,
    table_id?: Table
    order_status: OrderStatus
    source?: OrderSource
    guest_count?: number
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
    is_paid?: boolean;
    opened_at?: Date | string
    paid_time?: Date | string
    closed_at?: Date | string
    subtotal?: number
    discount_amount?: number
    tax_amount?: number
    service_charge?: number
    total_amount?: number
    paid_amount?: number
    change_amount?: number
    cashier_name?: string
    customer_name?: string
    note?: string
}

export interface OrderItems {
    dish_id: Dish | string
    order_id: Order | string
    createdAt?: string;
    updatedAt?: string;
    publishedAt?: string;
}
