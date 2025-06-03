import { useQuery } from "@tanstack/react-query"
import { getAllCategories } from "./service"

export const useGetAllCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => getAllCategories({
            'populate': '*'
        })
    })
}