import axios from "axios";
import { Payment } from "./type";

export const getPayments = async (params?: Record<string, string | number>) => {
  const response = await axios.get("/api/payments", { params });
  return response.data;
};

export const createPayment = async (payment: Payment) => {
  const payload: Payment = {
    ...payment,
    method: payment.method ?? "cash",
    status: payment.status ?? "success",
    currency: payment.currency ?? "VND",
    paid_at: payment.paid_at ?? new Date().toISOString(),
  };

  const response = await axios.post("/api/payments", { data: payload });
  return response.data;
};
