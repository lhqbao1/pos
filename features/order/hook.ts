import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createOrder, getOrderByTable, getOrders, updateOrderStatus } from "./services";
import { createOrderItem } from "../order-items/services";

interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  minPrice?: number;
  maxPrice?: number;
  category?: string[];
  search?: string;
  sort?: string;
  order_status?: string;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  [key: string]: any; // allows additional custom filters
}

export const useGetOrders = (params?: OrderQueryParams) => {
    const filters: Record<string, any> = {};

    if (params?.order_status && params?.order_status !== 'all') filters['filters[order_status]'] = params.order_status;
    if (params?.start_date) filters['filters[updatedAt][$gte]'] = params.start_date;
    if (params?.end_date) filters['filters[updatedAt][$lte]'] = params.end_date;


    const filter: Record<string, any> = {
        'populate': '*',
        ...filters
    };

    return useQuery({
        queryKey: ['orders', filter],
        queryFn: () => getOrders(filter)
    })
}

export const useCreateOrder = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createOrder,
        onSuccess: async () => {
            queryClient.invalidateQueries(['order-table']);
            console.log("Order created successfully");
        }
    });
};

export const useGetOrderByTable = (tableId?: string) => {
    return useQuery({
        queryKey: ['order-table', tableId],
        queryFn: () => getOrderByTable(tableId),
        enabled: !!tableId
    });
}

export const useUpdateOrderStatus = () => { 
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({id, order_status, is_paid, paid_time, total_amount}: {id: string, order_status: string, is_paid: boolean, paid_time: Date, total_amount: number}) => {
            return updateOrderStatus(id, order_status, is_paid, paid_time, total_amount);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['order-table']);
        }
    });
}