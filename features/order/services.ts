import axios from "axios"
import { Order } from "./type"

export const getOrders = async (params: Record<string, string | number>) => {
    const res = await axios.get('http://localhost:1337/api/orders', {params})
    return res.data
}

export const getOrderItemsWithTable = async (params: Record<string, string | number>) => {
    const res = await axios.get('http://localhost:1337/api/order-items', {params})
    return res.data
}

export const createOrder = async (order: Order) => {
    const res = await axios.post('http://localhost:1337/api/orders', {
      data: {
        order_status: order.order_status,
        table_id: order.table_id,
        is_paid: order.is_paid,
      },
    });
    return res.data;
}

export const getOrderByTable = async (tableId?: string) => {
    const res = await axios.get(`http://localhost:1337/api/orders?filters[table_id][documentId][$eq]=${tableId}&populate=*`);
    return res.data;
}

export const updateOrderStatus = async (id: string, order_status: string, is_paid?: boolean, paid_time?: Date, total_amount?: number) => {
    const res = await axios.put(`http://localhost:1337/api/orders/${id}`, {
        data: {
            order_status: order_status,
            is_paid: is_paid,
            paid_time: paid_time,
            total_amount: total_amount,
        },
    });
    return res.data;
}