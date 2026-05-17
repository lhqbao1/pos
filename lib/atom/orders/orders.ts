import { atom } from "jotai";
import { OrderStatusFilter } from "@/features/order/status";

export const statusFilterAtom = atom<OrderStatusFilter>("all");
export const startDateFilterAtom = atom<string>();
const createEndOfTodayISOString = () => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  return now.toISOString();
};

export const endDateFilterAtom = atom<string>(createEndOfTodayISOString());
