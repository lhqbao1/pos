import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createTable, getTableByTableNumber, getTables, updateTableStatus } from "./services"
import { TablePayload } from "./type"

export const useGetTables = () => {
    return useQuery({
        queryKey: ['tables'],
        queryFn: () => getTables({
            'sort': 'tableNumber:asc',
        })
    })
}

export const useCreateTable = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TablePayload) => createTable(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tables'] })
      await queryClient.refetchQueries({ queryKey: ['tables'], type: 'active' })
    },
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tables'] });
      await queryClient.invalidateQueries({ queryKey: ['table'] });
    },
  });
};
