import axios from "axios"
import { OrderItem } from "./type"

export const getOrderItemsByTable = async (params?: Record<string, string | number>) => {
    const response = await axios.get('http://localhost:1337/api/order-items', {params})
    return response.data
}

export const createOrderItem = async (data?: OrderItem) => {
    const response = await axios.post('http://localhost:1337/api/order-items', { data })
    return response.data
}

export const updateOrderItemQuantity = async (id: string, quantity: number) => {
    const response = await axios.put(`http://localhost:1337/api/order-items/${id}`, { data: { quantity } })
    return response.data
}

export const deleteOrderItem = async (id: string) => {  
    const response = await axios.delete(`http://localhost:1337/api/order-items/${id}`)
    return response.data
}

export const getOrderItemsByOrderId = async (params?: Record<string, string | number>) => {
    const response = await axios.get(`http://localhost:1337/api/order-items`, {
       params
    })
    return response.data
}