import axios from 'axios'
import { DishPayload } from './type'

export const getDishes = async (params?: Record<string, string | number>) => {
  const response = await axios.get('/api/dishes', { params })
  return response.data
}

export const getDishesByCategory = async(params?: Record<string, string | number>) => {
  const response = await axios.get('/api/dishes', { params })
  return response.data
}

export const getDishByDocumentId = async (documentId: string, params?: Record<string, string | number>) => {
  const response = await axios.get(`/api/dishes/${documentId}`, { params })
  return response.data
}

export const createDish = async (payload: DishPayload) => {
  const response = await axios.post('/api/dishes', {
    data: payload
  })
  return response.data
}

export const updateDish = async (documentId: string, payload: Partial<DishPayload>) => {
  const response = await axios.put(`/api/dishes/${documentId}`, {
    data: payload
  })
  return response.data
}

export const deleteDish = async (documentId: string) => {
  const response = await axios.delete(`/api/dishes/${documentId}`)
  return response.data
}

export const uploadDishImage = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post('/api/upload', formData)
  return response.data
}
