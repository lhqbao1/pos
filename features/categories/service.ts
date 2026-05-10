import axios from "axios";
import { CategoryPayload } from './type'

export async function getAllCategories(params?: Record<string, string | number>){
    const response = await axios.get('/api/categories', { params })
    return response.data
}

export async function getCategoryByDocumentId(documentId: string, params?: Record<string, string | number>) {
    const response = await axios.get(`/api/categories/${documentId}`, { params })
    return response.data
}

export async function createCategory(payload: CategoryPayload) {
    const response = await axios.post('/api/categories', {
        data: payload,
    })
    return response.data
}

export async function updateCategory(documentId: string, payload: Partial<CategoryPayload>) {
    const response = await axios.put(`/api/categories/${documentId}`, {
        data: payload,
    })
    return response.data
}

export async function deleteCategory(documentId: string) {
    const response = await axios.delete(`/api/categories/${documentId}`)
    return response.data
}
