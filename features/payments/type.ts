import { Order } from "../order/type";

export type PaymentMethod = "cash" | "card" | "bank_transfer" | "e_wallet";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export interface Payment {
  id?: number;
  documentId?: string;
  order_id: string | Order;
  method?: PaymentMethod;
  status?: PaymentStatus;
  amount: number;
  currency?: string;
  paid_at?: Date | string;
  reference?: string;
  note?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}
