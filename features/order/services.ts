import { isOrderClosed } from "./status";
import { Order, OrderStatus } from "./type"
import axios from "axios";

export const getOrders = async (params: Record<string, string | number>) => {
    const res = await axios.get('/api/orders', { params })
    return res.data
}

export const getOrderItemsWithTable = async (params: Record<string, string | number>) => {
    const res = await axios.get('/api/order-items', { params })
    return res.data
}

export const createOrder = async (order: Order) => {
    const payload = {
      order_no: order.order_no ?? `ord-${Date.now()}`,
      order_status: order.order_status ?? 'active',
      table_id: order.table_id,
      is_paid: order.is_paid ?? false,
      source: order.source ?? 'dine_in',
      guest_count: order.guest_count ?? 1,
      opened_at: order.opened_at ?? new Date().toISOString(),
      subtotal: order.subtotal ?? 0,
      discount_amount: order.discount_amount ?? 0,
      tax_amount: order.tax_amount ?? 0,
      service_charge: order.service_charge ?? 0,
      total_amount: order.total_amount ?? 0,
      paid_amount: order.paid_amount ?? 0,
      change_amount: order.change_amount ?? 0,
      cashier_name: order.cashier_name,
      customer_name: order.customer_name,
      note: order.note,
    }

    const res = await axios.post('/api/orders', {
      data: payload,
    });
    return res.data;
}

export const getOrderByTable = async (tableId?: string) => {
    const res = await axios.get('/api/orders', {
        params: {
            'filters[table_id][documentId][$eq]': tableId,
            populate: '*',
        },
    });
    return res.data;
}

export const updateOrderStatus = async (
    id: string,
    order_status: OrderStatus,
    is_paid?: boolean,
    paid_time?: Date | string,
    total_amount?: number,
    paid_amount?: number,
    change_amount?: number
) => {
    const res = await axios.put(`/api/orders/${id}`, {
        data: {
            order_status: order_status,
            is_paid: is_paid,
            paid_time: paid_time,
            total_amount: total_amount,
            paid_amount: paid_amount,
            change_amount: change_amount,
            closed_at: isOrderClosed(order_status) ? new Date().toISOString() : null,
        },
    });
    return res.data;
}

export const patchOrderCustomerName = async (
    id: string,
    customer_name: string
) => {
    try {
        const res = await axios.put(`/api/orders/${id}`, {
            data: {
                customer_name,
            },
        });
        return res.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const message =
                error.response?.data?.message ||
                error.response?.data?.error?.message ||
                error.message;
            throw new Error(message);
        }

        throw error;
    }
}
