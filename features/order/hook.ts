import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createOrder, getOrderByTable, getOrders, patchOrderCustomerName, updateOrderStatus } from "./services";
import { OrderStatusFilter } from "./status";
import { OrderStatus } from "./type";

interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  minPrice?: number;
  maxPrice?: number;
  category?: string[];
  search?: string;
  sort?: string;
  order_status?: OrderStatusFilter;
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
        mutationFn: async ({
            id,
            order_status,
            is_paid,
            paid_time,
            total_amount,
            paid_amount,
            change_amount,
        }: {
            id: string,
            order_status: OrderStatus,
            is_paid?: boolean,
            paid_time?: Date | string,
            total_amount?: number,
            paid_amount?: number,
            change_amount?: number,
        }) => {
            return updateOrderStatus(id, order_status, is_paid, paid_time, total_amount, paid_amount, change_amount);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['order-table']);
            queryClient.invalidateQueries(['orders']);
        }
    });
}

export const useUpdateOrderCustomerName = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            id,
            customer_name,
        }: {
            id: string;
            customer_name: string;
        }) => {
            if (!id) {
                throw new Error("Không tìm thấy mã hóa đơn để lưu tên khách hàng.");
            }
            return patchOrderCustomerName(id, customer_name);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['order-table']);
            queryClient.invalidateQueries(['orders']);
        }
    });
}
