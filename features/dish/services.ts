import axios from 'axios'

export const getDishes = async (params?: Record<string, string | number>) => {
  const response = await axios.get('http://localhost:1337/api/dishes',{params})
  return response.data
}

export const getDishesByCategory = async(params?: Record<string, string | number>) => {
  const response = await axios.get('http://localhost:1337/api/dishes', {params})
  return response.data
}