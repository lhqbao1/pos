import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getTableByTableNumber, getTables, updateTableStatus } from "./services"

export const useGetTables = () => {
    return useQuery({
        queryKey: ['tables'],
        queryFn: () => getTables({
            'sort': 'tableNumber:asc',
        })
    })
}

export const useGetTableByTableNumber = (tableNumber?: string) => {
    const filter: Record<string, string | any> = {
        'filters[tableNumber][$eq]': tableNumber
    }
    return useQuery({
        queryKey: ['table', tableNumber],
        queryFn: () => getTableByTableNumber(filter),
        enabled: !!tableNumber
    })
}

export const useUpdateTableStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTableStatus,
    onSuccess: () => {
      queryClient.invalidateQueries(['tables']);
    },
  });
};