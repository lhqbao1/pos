import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createOrderItem, deleteOrderItem, getOrderItemsByOrderId, getOrderItemsByTable, updateOrderItemQuantity } from "./services"
import { OrderItem } from "./type"



export const useGetOrderItemsWithTable = (table_number?: string) => {
    const filters: Record<string, string | any> = {
        'populate[order_id][populate]': 'table_id',
        'filters[order_id][table_id][tableNumber][$eq]': table_number,
        'populate': 'dish_id',
        'sort': 'createdAt:asc'
    }

    return useQuery({
        queryKey: ['order-items-with-table',filters],
        queryFn: () => getOrderItemsByTable(filters),
        enabled: !!table_number
    })
}

export const useCreateOrderItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
       mutationFn: (data: OrderItem) => {
        const dish = typeof data.dish_id === 'string' ? undefined : data.dish_id

        return createOrderItem({
            dish_id: data.dish_id,
            order_id: data.order_id,
            quantity: data.quantity,
            price_at_order: data.price_at_order,
            line_total: data.line_total,
            discount_amount: data.discount_amount ?? 0,
            dish_name_snapshot: data.dish_name_snapshot ?? dish?.name,
            dish_sku_snapshot: data.dish_sku_snapshot ?? dish?.sku,
            note: data.note,
            kitchen_status: data.kitchen_status ?? 'pending',
        })
       },
       onSuccess: () => {
        queryClient.invalidateQueries(['order-items-with-table'])
       }
    })
}

export const useUpdateOrderItemQuantity = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({id, quantity}: {id: string, quantity: number}) => {
            return updateOrderItemQuantity(id, quantity)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['order-items-with-table'])
        }
    })
}

export const useDeleteOrderItem = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => {
            return deleteOrderItem(id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['order-items-with-table'])
        }
    })
}

export const useGetOrderItemsByOrderId = (documentId : string) => {
    const filters: Record<string , string | number> = {} 

    if (documentId) {
        filters['filters[order_id][documentId][$eq]'] = documentId
    }

    const filter = {
        "populate[0]": "order_id",
        "populate[1]": "dish_id",
        ...filters
    }

    return useQuery({
        queryKey: ['order-items-by-order-id', filter],
        queryFn: () => getOrderItemsByOrderId(filter),
        enabled: !!documentId
    })
}
