import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createCategory, deleteCategory, getAllCategories, getCategoryByDocumentId, updateCategory } from "./service"
import { CategoryPayload } from "./type"

export const useGetAllCategories = (params?: Record<string, string | number>) => {
    const mergedParams = {
        populate: '*',
        ...params
    }

    return useQuery({
        queryKey: ['categories', mergedParams],
        queryFn: () => getAllCategories(mergedParams)
    })
}

export const useGetCategoryByDocumentId = (documentId?: string, params?: Record<string, string | number>) => {
    return useQuery({
        queryKey: ['category', documentId, params],
        queryFn: () => getCategoryByDocumentId(documentId ?? '', params),
        enabled: !!documentId,
    })
}

export const useCreateCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: CategoryPayload) => createCategory(payload),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['categories'] })
            await queryClient.invalidateQueries({ queryKey: ['dish'] })
            await queryClient.refetchQueries({ queryKey: ['categories'], type: 'active' })
            await queryClient.refetchQueries({ queryKey: ['dish'], type: 'active' })
        },
    })
}

export const useUpdateCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ documentId, payload }: { documentId: string, payload: Partial<CategoryPayload> }) =>
            updateCategory(documentId, payload),
        onSuccess: async (_, variables) => {
            await queryClient.invalidateQueries({ queryKey: ['categories'] })
            await queryClient.invalidateQueries({ queryKey: ['category', variables.documentId] })
            await queryClient.invalidateQueries({ queryKey: ['dish'] })
            await queryClient.refetchQueries({ queryKey: ['categories'], type: 'active' })
            await queryClient.refetchQueries({ queryKey: ['category', variables.documentId], type: 'active' })
            await queryClient.refetchQueries({ queryKey: ['dish'], type: 'active' })
        },
    })
}

export const useDeleteCategory = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (documentId: string) => deleteCategory(documentId),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['categories'] })
            await queryClient.invalidateQueries({ queryKey: ['dish'] })
            await queryClient.refetchQueries({ queryKey: ['categories'], type: 'active' })
            await queryClient.refetchQueries({ queryKey: ['dish'], type: 'active' })
        },
    })
}
