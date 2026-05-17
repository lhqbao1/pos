import { OrderStatus } from "./type";

export type OrderStatusFilter = "all" | OrderStatus;

type OrderStatusMeta = {
  label: string;
  badgeClassName: string;
  isClosed: boolean;
};

const UNKNOWN_STATUS_META: OrderStatusMeta = {
  label: "Không xác định",
  badgeClassName: "bg-zinc-100 text-zinc-700 border border-zinc-200",
  isClosed: false,
};

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  empty: {
    label: "Chưa mở",
    badgeClassName: "bg-zinc-100 text-zinc-700 border border-zinc-200",
    isClosed: false,
  },
  active: {
    label: "Đang phục vụ",
    badgeClassName: "bg-amber-100 text-amber-800 border border-amber-200",
    isClosed: false,
  },
  paid: {
    label: "Đã thanh toán",
    badgeClassName: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    isClosed: true,
  },
  outstanding: {
    label: "Còn thiếu",
    badgeClassName: "bg-rose-100 text-rose-800 border border-rose-200",
    isClosed: true,
  },
  cancelled: {
    label: "Đã hủy",
    badgeClassName: "bg-zinc-200 text-zinc-700 border border-zinc-300",
    isClosed: true,
  },
  refunded: {
    label: "Đã hoàn tiền",
    badgeClassName: "bg-sky-100 text-sky-800 border border-sky-200",
    isClosed: true,
  },
};

export const ORDER_STATUS_FILTER_OPTIONS: Array<{
  value: OrderStatusFilter;
  label: string;
}> = [
  { value: "all", label: "Tất cả" },
  { value: "paid", label: ORDER_STATUS_META.paid.label },
  { value: "outstanding", label: ORDER_STATUS_META.outstanding.label },
  { value: "cancelled", label: ORDER_STATUS_META.cancelled.label },
  { value: "refunded", label: ORDER_STATUS_META.refunded.label },
];

export const CLOSED_ORDER_STATUSES: OrderStatus[] = (
  Object.entries(ORDER_STATUS_META) as Array<[OrderStatus, OrderStatusMeta]>
)
  .filter(([, meta]) => meta.isClosed)
  .map(([status]) => status);

export const isOrderClosed = (status?: string | null) =>
  !!status && CLOSED_ORDER_STATUSES.includes(status as OrderStatus);

export const canEditOrder = (status?: string | null) => status === "active";

export const getOrderStatusMeta = (status?: string | null): OrderStatusMeta => {
  if (status && status in ORDER_STATUS_META) {
    return ORDER_STATUS_META[status as OrderStatus];
  }

  return UNKNOWN_STATUS_META;
};
