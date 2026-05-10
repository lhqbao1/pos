import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPayment, getPayments } from "./services";
import { Payment } from "./type";

export const useGetPayments = (params?: Record<string, string | number>) => {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: () => getPayments(params),
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Payment) => createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["payments"]);
      queryClient.invalidateQueries(["orders"]);
      queryClient.invalidateQueries(["order-table"]);
    },
  });
};
