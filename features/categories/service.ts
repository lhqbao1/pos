import axios from 'axios'

export async function getAllCategories(params?: Record<string, string | number>){
    const response = await axios.get('http://localhost:1337/api/categories', {params})
    return response.data
}