import { OrderItem } from "./type"
import axios from "axios";

export const getOrderItemsByTable = async (params?: Record<string, string | number>) => {
    const response = await axios.get('/api/order-items', { params })
    return response.data
}

export const createOrderItem = async (data?: OrderItem) => {
    if (!data) {
        throw new Error('Order item payload is required')
    }

    const payload: OrderItem = {
        ...data,
        line_total: data.line_total ?? data.price_at_order * data.quantity,
        discount_amount: data.discount_amount ?? 0,
        kitchen_status: data.kitchen_status ?? 'pending',
    }

    const response = await axios.post('/api/order-items', { data: payload })
    return response.data
}

export const updateOrderItemQuantity = async (id: string, quantity: number) => {
    if (!id) {
      throw new Error("Không tìm thấy documentId của món trong đơn để cập nhật số lượng.");
    }

    const response = await axios.put(`/api/order-items/${id}`, { data: { quantity } })
    return response.data
}

export const deleteOrderItem = async (id: string) => {  
    if (!id) {
      throw new Error("Không tìm thấy documentId của món trong đơn để xóa.");
    }

    const response = await axios.delete(`/api/order-items/${id}`)
    return response.data
}

export const getOrderItemsByOrderId = async (params?: Record<string, string | number>) => {
    const response = await axios.get('/api/order-items', {
       params,
    })
    return response.data
}
