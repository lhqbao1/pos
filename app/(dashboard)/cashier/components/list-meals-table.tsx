"use client";
import {
  useDeleteOrderItem,
  useGetOrderItemsWithTable,
  useUpdateOrderItemQuantity,
} from "@/features/order-items/hook";
import { OrderItem } from "@/features/order-items/type";
import { tableIdAtom, tableNumberAtom } from "@/lib/atom/table/tables";
import { useAtom } from "jotai";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { ListOrdered, Minus, Plus, Utensils } from "lucide-react";
import { formattedNumber } from "@/lib/format-vnd";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  useGetOrderByTable,
  useUpdateOrderStatus,
} from "@/features/order/hook";
import { useGetTableByTableNumber, useUpdateTableStatus } from "@/features/tables/hook";
import { useCreatePayment } from "@/features/payments/hook";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ListCategory from "./list-tables/list-category";
import { toast } from "sonner";
import { formatElapsedDuration } from "@/lib/format-duration";

const ListMealsTable = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"ordered" | "menu">("ordered");
  const [currentTable] = useAtom(tableNumberAtom);
  const [currentTableId] = useAtom(tableIdAtom);
  const hasSelectedTable = Boolean(currentTable && currentTableId);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [optimisticQuantities, setOptimisticQuantities] = useState<
    Record<string, number>
  >({});
  const debounceTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const latestQuantityRef = useRef<Record<string, number>>({});
  const {
    data: listOrderItems,
    isInitialLoading: isOrderItemsInitialLoading,
    isFetching: isOrderItemsFetching,
    isError: isOrderItemsError,
    refetch: refetchOrderItems,
  } = useGetOrderItemsWithTable(currentTable);
  const {
    data: currentOrder,
    isInitialLoading: isCurrentOrderInitialLoading,
    isFetching: isCurrentOrderFetching,
    isError: isCurrentOrderError,
    refetch: refetchCurrentOrder,
  } = useGetOrderByTable(currentTableId);
  const { data: currentTableData } = useGetTableByTableNumber(currentTable);
  const { mutateAsync: updateOrderItemQuantity } = useUpdateOrderItemQuantity();
  const { mutateAsync: deleteOrderItem } = useDeleteOrderItem();
  const { mutate: updateOrderStatus } = useUpdateOrderStatus();
  const { mutate: updateTableStatus } = useUpdateTableStatus();
  const { mutate: createPayment } = useCreatePayment();

  useEffect(() => {
    setActiveTab("ordered");
  }, [currentTableId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getDishName = (dish: OrderItem["dish_id"]) => {
    if (typeof dish === "string") return dish;
    return dish?.name ?? "";
  };

  const getOrderItemDocumentId = (item: OrderItem) =>
    item.documentId ?? (typeof item.id === "number" ? String(item.id) : "");

  const baseOrderItems: OrderItem[] = listOrderItems?.data ?? [];
  const currentTableRecord = currentTableData?.data?.[0];
  const occupiedSince =
    currentTableRecord?.occupied_since ??
    currentOrder?.data?.[0]?.opened_at?.toString() ??
    null;
  const isTableUsing =
    currentTableRecord?.table_status === "Using" ||
    currentOrder?.data?.[0]?.order_status === "active";
  const usingDuration =
    isTableUsing
      ? formatElapsedDuration(occupiedSince, nowMs)
      : null;

  const clearDebounceTimer = (orderItemId: string) => {
    const timer = debounceTimersRef.current[orderItemId];
    if (timer) {
      clearTimeout(timer);
      delete debounceTimersRef.current[orderItemId];
    }
  };

  const syncQuantityWithServer = (orderItemId: string, quantity: number) => {
    latestQuantityRef.current[orderItemId] = quantity;
    clearDebounceTimer(orderItemId);

    debounceTimersRef.current[orderItemId] = setTimeout(async () => {
      const quantityToSync = latestQuantityRef.current[orderItemId];
      delete latestQuantityRef.current[orderItemId];
      clearDebounceTimer(orderItemId);

      try {
        if (quantityToSync <= 0) {
          await deleteOrderItem(orderItemId);
          setOptimisticQuantities((prev) => {
            const next = { ...prev };
            delete next[orderItemId];
            return next;
          });
          return;
        }

        await updateOrderItemQuantity({
          id: orderItemId,
          quantity: quantityToSync,
        });
      } catch {
        setOptimisticQuantities((prev) => {
          const next = { ...prev };
          delete next[orderItemId];
          return next;
        });
        toast.error("Cập nhật số lượng thất bại", {
          description: "Dữ liệu sẽ được tải lại từ máy chủ.",
        });
        await refetchOrderItems();
      }
    }, 300);
  };

  const updateLocalQuantity = (item: OrderItem, delta: number) => {
    const orderItemId = getOrderItemDocumentId(item);
    if (!orderItemId) {
      toast.error("Không tìm thấy mã món để cập nhật số lượng.");
      return;
    }

    const currentQuantity =
      latestQuantityRef.current[orderItemId] ??
      optimisticQuantities[orderItemId] ??
      item.quantity;
    const nextQuantity = Math.max(0, currentQuantity + delta);

    setOptimisticQuantities((prev) => ({
      ...prev,
      [orderItemId]: nextQuantity,
    }));

    syncQuantityWithServer(orderItemId, nextQuantity);
  };

  const displayedOrderItems = useMemo<OrderItem[]>(() => {
    return baseOrderItems
      .map((item: OrderItem) => {
        const orderItemId = getOrderItemDocumentId(item);
        if (!orderItemId) return item;

        const optimisticQuantity = optimisticQuantities[orderItemId];
        if (optimisticQuantity === undefined) return item;

        return {
          ...item,
          quantity: optimisticQuantity,
        };
      })
      .filter((item: OrderItem) => item.quantity > 0);
  }, [baseOrderItems, optimisticQuantities]);

  const totalAmount = useMemo(() => {
    return displayedOrderItems.reduce(
      (total: number, item: OrderItem) =>
        total + item.price_at_order * item.quantity,
      0,
    );
  }, [displayedOrderItems]);

  useEffect(() => {
    setOptimisticQuantities((prev) => {
      if (!Object.keys(prev).length) return prev;

      const next = { ...prev };
      let changed = false;

      for (const item of baseOrderItems) {
        const orderItemId = getOrderItemDocumentId(item);
        if (!orderItemId) continue;

        if (
          next[orderItemId] !== undefined &&
          next[orderItemId] === item.quantity &&
          !latestQuantityRef.current[orderItemId]
        ) {
          delete next[orderItemId];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [baseOrderItems]);

  useEffect(() => {
    setOptimisticQuantities({});
    latestQuantityRef.current = {};
    Object.keys(debounceTimersRef.current).forEach(clearDebounceTimer);
  }, [currentTableId]);

  useEffect(() => {
    return () => {
      Object.keys(debounceTimersRef.current).forEach(clearDebounceTimer);
    };
  }, []);

  //Create column
  const columns: ColumnDef<OrderItem>[] = [
    {
      accessorKey: "status",
      header: "STT",
      cell: ({ row }) => {
        return <div>{row.index + 1}</div>;
      },
    },
    {
      accessorFn: (row) => getDishName(row.dish_id),
      header: "Tên hàng hóa",
    },
    {
      accessorKey: "quantity",
      header: "Số lượng",
      cell: ({ row }) => {
        const quantity = row.original.quantity;

        const handleIncrease = () => {
          updateLocalQuantity(row.original, 1);
        };

        const handleDecrease = () => {
          updateLocalQuantity(row.original, -1);
        };

        return (
          <div className="flex justify-center items-center gap-2">
            <Button
              className="h-8 w-8 rounded-full bg-secondary p-0 text-white hover:bg-secondary/90 hover:text-white"
              onClick={handleDecrease}
            >
              <Minus className="h-3 w-3 font-bold text-white stroke-3" />
            </Button>
            <span className="w-8 text-base font-semibold text-[#4a2f18]">{quantity}</span>
            <Button
              className="h-8 w-8 rounded-full bg-secondary p-0 text-white hover:bg-secondary/90 hover:text-white"
              onClick={() => handleIncrease()}
            >
              <Plus className="h-3.5 w-3.5 font-bold text-white stroke-3" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "price_at_order",
      header: "Đơn giá",
      cell: ({ row }) => {
        return <div>{formattedNumber(row.original.price_at_order)}</div>;
      },
    },
    {
      accessorKey: "total_amount",
      header: "Thành tiền",
      cell: ({ row }) => {
        //Get price at order and quantity
        const { price_at_order, quantity } = row.original;

        //Calculate total amount by minus two of them
        const totalAmount = price_at_order * quantity;

        const formattedAmount = formattedNumber(totalAmount);

        return <div>{formattedAmount}</div>;
      },
    },
  ];

  //Assign data and columns to table
  const table = useReactTable({
    data: displayedOrderItems,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCalculateBill = () => {
    if (!currentOrder?.data?.[0]) {
      return;
    }

    const orderTotal = displayedOrderItems.reduce(
      (total: number, item: OrderItem) => total + item.price_at_order * item.quantity,
      0,
    );

    // Update order status
    updateOrderStatus({
      id: currentOrder?.data?.[0]?.documentId ?? "",
      order_status: "paid",
      is_paid: true,
      paid_time: new Date(),
      total_amount: orderTotal,
      paid_amount: orderTotal,
      change_amount: 0,
    });

    createPayment({
      order_id: currentOrder?.data?.[0]?.documentId ?? "",
      amount: orderTotal,
      method: "cash",
      status: "success",
      paid_at: new Date(),
      currency: "VND",
    });

    //Update table status
    updateTableStatus({
      table_id: currentTableId,
      table_status: "Empty",
      occupied_since: null,
      last_cleared_at: new Date().toISOString(),
    });
  };

  const handleRetry = async () => {
    if (!hasSelectedTable) return;
    await Promise.all([refetchOrderItems(), refetchCurrentOrder()]);
  };

  const isLoadingOrderItems =
    isOrderItemsInitialLoading || (isOrderItemsFetching && !listOrderItems);
  const isLoadingCurrentOrder =
    isCurrentOrderInitialLoading || (isCurrentOrderFetching && !currentOrder);
  const hasActiveOrderItems = Boolean(
    displayedOrderItems.length &&
    currentOrder?.data?.[0]?.order_status !== "paid",
  );

  if (!hasSelectedTable) {
    return (
      <div className="w-full h-full bg-white rounded-xl flex flex-col justify-center items-center gap-4 px-6 text-center">
        <Image
          src="/empty.png"
          alt="No table selected"
          width={260}
          height={260}
        />
        <h2 className="text-secondary font-bold text-xl uppercase">
          Chưa chọn bàn
        </h2>
        <p className="text-sm text-zinc-500">
          Vui lòng chọn bàn ở danh sách bên trái để bắt đầu gọi món.
        </p>
      </div>
    );
  }

  if (isLoadingOrderItems || isLoadingCurrentOrder) {
    return (
      <div className="h-full bg-white rounded-xl flex flex-col px-5 gap-3 py-4">
        <Skeleton className="h-[30px] rounded-full" />
        <Skeleton className="h-[30px] rounded-full" />
        <Skeleton className="h-[30px] rounded-full" />
        <Skeleton className="h-[30px] rounded-full" />
        <Skeleton className="h-[30px] rounded-full" />
        <Skeleton className="h-[30px] rounded-full" />
        <Skeleton className="h-[30px] rounded-full" />
        <Skeleton className="h-[30px] rounded-full" />
        <Skeleton className="h-[30px] rounded-full" />
        <Skeleton className="h-[30px] rounded-full" />
      </div>
    );
  }

  if (isOrderItemsError || isCurrentOrderError) {
    return (
      <div className="w-full h-full bg-white rounded-xl flex flex-col justify-center items-center gap-4 px-6 text-center">
        <h2 className="text-red-500 font-bold text-lg uppercase">
          Không tải được dữ liệu thu ngân
        </h2>
        <p className="text-sm text-zinc-500">
          Vui lòng kiểm tra kết nối hoặc quyền API trên Strapi.
        </p>
        <Button
          onClick={handleRetry}
          className="bg-secondary text-white hover:bg-secondary/90 hover:text-white"
        >
          Tải lại dữ liệu
        </Button>
      </div>
    );
  }

  return (
    <Card className="h-full overflow-hidden border-[#ead8c4] bg-white py-0 px-0 flex flex-col">
      <CardHeader className="space-y-3 border-b border-[#efdfcd] bg-gradient-to-r from-[#fffefb] via-[#fff8ef] to-[#fffdf8] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d6a47]">
              Thu ngân
            </p>
            <h3 className="text-lg font-bold text-[#4a2f18]">
              Bàn {currentTable}
            </h3>
            {usingDuration ? (
              <p className="mt-1 inline-flex items-center rounded-full border border-[#f3d7b2] bg-[#fff4e6] px-2.5 py-0.5 text-xs font-semibold text-[#9b642f]">
                Thời gian dùng: {usingDuration}
              </p>
            ) : null}
          </div>
          {activeTab === "ordered" ? (
            <Button
              type="button"
              className="rounded-xl bg-primary px-4 text-primary-foreground hover:opacity-95"
              onClick={() => setActiveTab("menu")}
            >
              <Utensils className="mr-2 h-4 w-4" />
              Chọn món ăn
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-[#e5d4bf] bg-white text-[#6f4b2a] hover:bg-[#fff7ed] hover:text-[#6f4b2a]"
              onClick={() => setActiveTab("ordered")}
            >
              <ListOrdered className="mr-2 h-4 w-4" />
              Xem món đã gọi
            </Button>
          )}
        </div>

        <div className="inline-flex w-fit rounded-xl border border-[#e7d6c3] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("ordered")}
            className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "ordered"
                ? "bg-secondary text-white"
                : "text-[#6d4c2f] hover:bg-[#fff5e8]"
            }`}
          >
            <ListOrdered className="mr-2 h-4 w-4" />
            Món đã gọi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("menu")}
            className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "menu"
                ? "bg-secondary text-white"
                : "text-[#6d4c2f] hover:bg-[#fff5e8]"
            }`}
          >
            <Utensils className="mr-2 h-4 w-4" />
            Chọn món
          </button>
        </div>
      </CardHeader>

      {activeTab === "menu" ? (
        <CardContent className="flex-1 overflow-y-auto p-4 pt-0">
          <ListCategory />
        </CardContent>
      ) : (
        <>
          <CardContent className="flex-1 overflow-y-auto px-0 py-4">
            {hasActiveOrderItems ? (
              <div className="mx-4 overflow-hidden rounded-2xl border border-[#ead7c0] bg-white shadow-sm">
                <Table>
                  <TableHeader className="bg-[#f6d3a7]">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header, index) => {
                          const isFirst = index === 0;
                          const isLast =
                            index === headerGroup.headers.length - 1;
                          return (
                            <TableHead
                              key={header.id}
                              className={`
                                                                ${isFirst ? "rounded-tl-xl" : ""}
                                                                ${isLast ? "rounded-tr-xl" : ""}
                                                                border-b border-[#eddcc8] py-4 text-center text-base font-bold text-[#3f2b16]
                                                            `}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel()?.rows?.length ? (
                      table.getRowModel()?.rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className="border-b border-[#f1e6d8] last:border-0 hover:bg-[#fffaf2]"
                        >
                          {row.getVisibleCells().map((cell, cellIndex) => (
                            <TableCell
                              key={cell.id}
                              className={`py-4 text-center text-base text-[#2f2318] ${
                                cellIndex === 1 ? "font-medium" : ""
                              }`}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center"
                        >
                          Không có dữ liệu.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-5 px-6 text-center">
                <Image
                  src="/empty.png"
                  alt="No ordered dish"
                  width={260}
                  height={260}
                />
                <h2 className="text-secondary font-bold text-2xl uppercase">
                  Chưa có món ăn nào được gọi
                </h2>
                <p className="max-w-md text-sm text-zinc-500">
                  Chuyển sang tab "Chọn món" để thêm món vào bàn hiện tại.
                </p>
                <Button
                  type="button"
                  className="rounded-xl bg-primary text-primary-foreground hover:opacity-95"
                  onClick={() => setActiveTab("menu")}
                >
                  <Utensils className="mr-2 h-4 w-4" />
                  Chọn món ăn
                </Button>
              </div>
            )}
          </CardContent>

          {hasActiveOrderItems ? (
            <CardFooter className="mt-auto rounded-b-xl border-t border-dashed border-[#deccb7] bg-gradient-to-r from-[#fffefb] via-[#fff9f1] to-[#fffef9] px-6 py-5">
              <div className="flex w-full flex-wrap items-end justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7857]">
                    Tổng cộng
                  </p>
                  <p className="text-3xl font-bold text-secondary">
                    {formattedNumber(totalAmount)} VND
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                  <Button
                    onClick={() => setOpenDialog(!openDialog)}
                    className="h-12 min-w-[170px] rounded-xl bg-secondary px-6 text-base font-semibold text-white hover:bg-secondary/90 hover:text-white"
                  >
                    Thanh toán
                  </Button>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tính tiền bàn {currentTable}</DialogTitle>
                      <DialogDescription>
                        Bạn có chắc chắn muốn tính tiền bàn {currentTable}{" "}
                        không?
                        <br />
                        Sau khi xác nhận, bạn sẽ không thể chỉnh sửa đơn hàng
                        này nữa.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCalculateBill}
                        className="text-white cursor-pointer"
                      >
                        Xác nhận
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        className="text-black cursor-pointer"
                        onClick={() => setOpenDialog(false)}
                      >
                        Hủy
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button className="h-12 min-w-[150px] rounded-xl bg-orange-200 px-6 text-base font-semibold text-[#3f2b16] hover:bg-orange-200/90">
                  Tạm tính
                </Button>
                </div>
              </div>
            </CardFooter>
          ) : null}
        </>
      )}
    </Card>
  );
};

export default ListMealsTable;
