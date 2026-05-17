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
  useUpdateOrderCustomerName,
  useUpdateOrderStatus,
} from "@/features/order/hook";
import { Order, OrderStatus } from "@/features/order/type";
import {
  useGetTableByTableNumber,
  useUpdateTableStatus,
} from "@/features/tables/hook";
import { useCreatePayment } from "@/features/payments/hook";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import ListCategory from "./list-tables/list-category";
import { toast } from "sonner";
import { formatElapsedDuration } from "@/lib/format-duration";
import { Printer } from "lucide-react";

type ReceiptItemSnapshot = {
  dishName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type ReceiptSnapshot = {
  website: string;
  printedAt: string;
  tableLabel: string;
  orderNo: string;
  customerName: string;
  items: ReceiptItemSnapshot[];
  subtotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  totalInWords: string;
};

const RECEIPT_PROFILE = {
  storeLine1: "Quán Ăn Gia Đình",
  storeLine2: "THÙY LINH",
  addressLines: ["251A3 Đường A3, Hưng", "Phú, C. Thơ."],
  phone: "0918 663 065",
};

const VIETNAMESE_DIGITS = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
];

const VIETNAMESE_UNITS = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"];

const formatReceiptMoney = (value: number) => value.toLocaleString("vi-VN");

const getDigitsOnly = (value: string) => value.replace(/[^\d]/g, "");

const parseMoneyInput = (value: string) => {
  const normalized = getDigitsOnly(value);
  if (!normalized) return 0;

  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const resolveOrderTimestamp = (value?: Date | string) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const capitalizeFirstLetter = (value: string) => {
  if (!value.length) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const readThreeDigits = (value: number, full: boolean) => {
  const hundred = Math.floor(value / 100);
  const ten = Math.floor((value % 100) / 10);
  const unit = value % 10;
  const result: string[] = [];

  if (full || hundred > 0) {
    result.push(VIETNAMESE_DIGITS[hundred], "trăm");
    if (ten === 0 && unit > 0) result.push("lẻ");
  }

  if (ten > 1) {
    result.push(VIETNAMESE_DIGITS[ten], "mươi");
    if (unit === 1) result.push("mốt");
    else if (unit === 4) result.push("tư");
    else if (unit === 5) result.push("lăm");
    else if (unit > 0) result.push(VIETNAMESE_DIGITS[unit]);
  } else if (ten === 1) {
    result.push("mười");
    if (unit === 5) result.push("lăm");
    else if (unit > 0) result.push(VIETNAMESE_DIGITS[unit]);
  } else if (unit > 0) {
    result.push(VIETNAMESE_DIGITS[unit]);
  }

  return result.join(" ").replace(/\s+/g, " ").trim();
};

const numberToVietnameseWords = (value: number) => {
  const normalized = Math.max(0, Math.round(value));
  if (normalized === 0) return "Không đồng chẵn";

  const groups: number[] = [];
  let remaining = normalized;

  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const chunks: string[] = [];
  let hasSpokenChunk = false;

  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const groupValue = groups[index];
    if (groupValue === 0) continue;

    const chunk = readThreeDigits(groupValue, hasSpokenChunk);
    const unit = VIETNAMESE_UNITS[index] ?? "";
    chunks.push([chunk, unit].filter(Boolean).join(" "));
    hasSpokenChunk = true;
  }

  return `${capitalizeFirstLetter(chunks.join(" ").replace(/\s+/g, " ").trim())} đồng chẵn`;
};

const ListMealsTable = () => {
  const [openPaymentDrawer, setOpenPaymentDrawer] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [paidAmountInput, setPaidAmountInput] = useState("");
  const [isSavingCustomerName, setIsSavingCustomerName] = useState(false);
  const [activeTab, setActiveTab] = useState<"ordered" | "menu">("ordered");
  const [receiptSnapshot, setReceiptSnapshot] = useState<ReceiptSnapshot | null>(
    null,
  );
  const [currentTable] = useAtom(tableNumberAtom);
  const [currentTableId] = useAtom(tableIdAtom);
  const hasSelectedTable = Boolean(currentTable && currentTableId);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [optimisticQuantities, setOptimisticQuantities] = useState<
    Record<string, number>
  >({});
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>(
    {},
  );
  const debounceTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
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
  const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus();
  const { mutateAsync: updateOrderCustomerName } = useUpdateOrderCustomerName();
  const { mutateAsync: updateTableStatus } = useUpdateTableStatus();
  const { mutateAsync: createPayment } = useCreatePayment();

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

  const allOrderItems: OrderItem[] = listOrderItems?.data ?? [];
  const orderRecords: Order[] = currentOrder?.data ?? [];
  const currentOrderRecord = useMemo(() => {
    const activeOrders = orderRecords.filter(
      (order) => order.order_status === "active",
    );
    if (!activeOrders.length) return undefined;

    return activeOrders.reduce((latestOrder, nextOrder) => {
      const latestTimestamp = Math.max(
        resolveOrderTimestamp(latestOrder.updatedAt),
        resolveOrderTimestamp(latestOrder.createdAt),
        resolveOrderTimestamp(latestOrder.opened_at),
        resolveOrderTimestamp(latestOrder.paid_time),
        resolveOrderTimestamp(latestOrder.closed_at),
      );

      const nextTimestamp = Math.max(
        resolveOrderTimestamp(nextOrder.updatedAt),
        resolveOrderTimestamp(nextOrder.createdAt),
        resolveOrderTimestamp(nextOrder.opened_at),
        resolveOrderTimestamp(nextOrder.paid_time),
        resolveOrderTimestamp(nextOrder.closed_at),
      );

      return nextTimestamp >= latestTimestamp ? nextOrder : latestOrder;
    });
  }, [orderRecords]);
  const currentOrderDocumentId = currentOrderRecord?.documentId;
  const baseOrderItems: OrderItem[] = useMemo(() => {
    if (!currentOrderDocumentId) return [];

    return allOrderItems.filter((item) => {
      if (typeof item.order_id === "string") {
        return item.order_id === currentOrderDocumentId;
      }

      return item.order_id?.documentId === currentOrderDocumentId;
    });
  }, [allOrderItems, currentOrderDocumentId]);
  const currentTableRecord = currentTableData?.data?.[0];
  const occupiedSince =
    currentTableRecord?.occupied_since ??
    currentOrderRecord?.opened_at?.toString() ??
    null;
  const isTableUsing =
    currentTableRecord?.table_status === "Using" ||
    currentOrderRecord?.order_status === "active";
  const usingDuration = isTableUsing
    ? formatElapsedDuration(occupiedSince, nowMs)
    : null;

  useEffect(() => {
    setCustomerNameInput(currentOrderRecord?.customer_name ?? "");
  }, [currentOrderRecord?.documentId, currentOrderRecord?.customer_name]);

  const formatDateTime = (value: Date | string) =>
    new Date(value).toLocaleString("vi-VN", {
      hour12: false,
    });

  const flushPendingQuantityUpdates = async () => {
    const pendingUpdates = Object.entries(latestQuantityRef.current);
    if (!pendingUpdates.length) return;

    pendingUpdates.forEach(([orderItemId]) => clearDebounceTimer(orderItemId));
    latestQuantityRef.current = {};

    await Promise.all(
      pendingUpdates.map(async ([orderItemId, quantity]) => {
        if (quantity <= 0) {
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
          quantity,
        });
      }),
    );
  };

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
    }, 500);
  };

  const clearQuantityDraft = (orderItemId: string) => {
    setQuantityDrafts((prev) => {
      if (prev[orderItemId] === undefined) return prev;
      const next = { ...prev };
      delete next[orderItemId];
      return next;
    });
  };

  const setLocalQuantity = (item: OrderItem, nextQuantity: number) => {
    const orderItemId = getOrderItemDocumentId(item);
    if (!orderItemId) {
      toast.error("Không tìm thấy mã món để cập nhật số lượng.");
      return;
    }

    const sanitizedQuantity = Math.max(0, Math.floor(nextQuantity));

    setOptimisticQuantities((prev) => ({
      ...prev,
      [orderItemId]: sanitizedQuantity,
    }));

    syncQuantityWithServer(orderItemId, sanitizedQuantity);
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

    clearQuantityDraft(orderItemId);
    setLocalQuantity(item, nextQuantity);
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

  const paidAmountValue = useMemo(
    () => parseMoneyInput(paidAmountInput),
    [paidAmountInput],
  );

  const outstandingAmount = Math.max(totalAmount - paidAmountValue, 0);
  const changeAmount = Math.max(paidAmountValue - totalAmount, 0);
  const willMarkOutstanding = paidAmountValue < totalAmount;

  useEffect(() => {
    if (!openPaymentDrawer) return;

    const currentPaidAmount = currentOrderRecord?.paid_amount ?? 0;
    const nextPaidAmount = currentPaidAmount > 0 ? currentPaidAmount : totalAmount;
    setPaidAmountInput(String(nextPaidAmount));
  }, [openPaymentDrawer, currentOrderRecord?.documentId, currentOrderRecord?.paid_amount, totalAmount]);

  const buildReceiptSnapshot = (
    orderTotal: number,
    paidAmount: number,
    currentChangeAmount: number,
  ): ReceiptSnapshot => {
    const printableItems = displayedOrderItems.map((item) => {
      const unitPrice = item.price_at_order;
      const lineTotal = unitPrice * item.quantity;

      return {
        dishName: getDishName(item.dish_id),
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      };
    });

    const customerName =
      customerNameInput.trim() || currentOrderRecord?.customer_name || "Khách lẻ";
    const orderNo = String(
      currentOrderRecord?.order_no ?? currentOrderRecord?.documentId ?? "Khách lẻ",
    );
    const website =
      typeof window !== "undefined" ? window.location.host : "www.pos360.vn";

    return {
      website,
      printedAt: formatDateTime(new Date()),
      tableLabel: currentTable ?? "-",
      orderNo,
      customerName,
      items: printableItems,
      subtotal: orderTotal,
      discount: 0,
      grandTotal: orderTotal,
      paidAmount,
      changeAmount: currentChangeAmount,
      totalInWords: numberToVietnameseWords(orderTotal),
    };
  };

  const printReceipt = async (snapshot: ReceiptSnapshot) => {
    setReceiptSnapshot(snapshot);
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
    await new Promise<void>((resolve) => {
      window.setTimeout(() => resolve(), 100);
    });
    window.print();
  };

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
    setQuantityDrafts((prev) => {
      if (!Object.keys(prev).length) return prev;

      const validOrderItemIds = new Set(
        baseOrderItems
          .map((item) => getOrderItemDocumentId(item))
          .filter((id): id is string => Boolean(id)),
      );

      let changed = false;
      const next = { ...prev };

      Object.keys(next).forEach((id) => {
        if (!validOrderItemIds.has(id)) {
          delete next[id];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [baseOrderItems]);

  useEffect(() => {
    setOptimisticQuantities({});
    setQuantityDrafts({});
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
        const orderItemId = getOrderItemDocumentId(row.original);
        const quantity = row.original.quantity;
        const quantityInputValue =
          orderItemId && quantityDrafts[orderItemId] !== undefined
            ? quantityDrafts[orderItemId]
            : String(quantity);

        const handleIncrease = () => {
          updateLocalQuantity(row.original, 1);
        };

        const handleDecrease = () => {
          updateLocalQuantity(row.original, -1);
        };

        const handleQuantityInputChange = (
          event: React.ChangeEvent<HTMLInputElement>,
        ) => {
          if (!orderItemId) return;

          const nextValue = event.target.value.replace(/[^\d]/g, "");
          setQuantityDrafts((prev) => ({ ...prev, [orderItemId]: nextValue }));

          if (!nextValue) return;

          const parsedQuantity = Number.parseInt(nextValue, 10);
          if (!Number.isNaN(parsedQuantity)) {
            setLocalQuantity(row.original, parsedQuantity);
          }
        };

        const handleQuantityInputBlur = () => {
          if (!orderItemId) return;

          const draftValue = quantityDrafts[orderItemId];
          if (draftValue === undefined) return;

          if (!draftValue) {
            clearQuantityDraft(orderItemId);
            return;
          }

          const parsedQuantity = Number.parseInt(draftValue, 10);
          if (!Number.isNaN(parsedQuantity)) {
            setLocalQuantity(row.original, parsedQuantity);
          }

          clearQuantityDraft(orderItemId);
        };

        const handleQuantityInputKeyDown = (
          event: React.KeyboardEvent<HTMLInputElement>,
        ) => {
          if (!orderItemId) return;

          if (event.key === "Enter") {
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            clearQuantityDraft(orderItemId);
            event.currentTarget.blur();
          }
        };

        return (
          <div className="flex justify-center items-center gap-2">
            <Button
              className="h-8 w-8 rounded-full bg-secondary p-0 text-white hover:bg-secondary/90 hover:text-white"
              onClick={handleDecrease}
            >
              <Minus className="h-3 w-3 font-bold text-white stroke-3" />
            </Button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={quantityInputValue}
              onChange={handleQuantityInputChange}
              onBlur={handleQuantityInputBlur}
              onKeyDown={handleQuantityInputKeyDown}
              className="h-8 w-14 rounded-md border border-[#e4d1ba] bg-white text-center text-base font-semibold text-[#4a2f18] outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              aria-label="Nhập số lượng món"
            />
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

  const handlePrintAndCheckout = async ({
    forceOutstanding,
  }: {
    forceOutstanding?: boolean;
  } = {}) => {
    if (!currentOrderRecord || !currentTableId) {
      toast.error("Không tìm thấy thông tin đơn/bàn để thanh toán.");
      return;
    }

    if (!displayedOrderItems.length) {
      toast.error("Chưa có món để thanh toán.");
      return;
    }

    setIsProcessingPayment(true);

    const orderTotal = displayedOrderItems.reduce(
      (total: number, item: OrderItem) =>
        total + item.price_at_order * item.quantity,
      0,
    );
    const receivedAmount = forceOutstanding
      ? 0
      : Math.max(0, Math.floor(parseMoneyInput(paidAmountInput)));
    const remainingAmount = Math.max(orderTotal - receivedAmount, 0);
    const nextChangeAmount = Math.max(receivedAmount - orderTotal, 0);
    const nextOrderStatus: OrderStatus =
      forceOutstanding || remainingAmount > 0 ? "outstanding" : "paid";

    try {
      await flushPendingQuantityUpdates();

      const trimmedCustomerName = customerNameInput.trim();
      const currentCustomerName = (currentOrderRecord.customer_name ?? "").trim();

      if (trimmedCustomerName !== currentCustomerName) {
        await updateOrderCustomerName({
          id: currentOrderRecord.documentId ?? "",
          customer_name: trimmedCustomerName,
        });
      }

      await updateOrderStatus({
        id: currentOrderRecord?.documentId ?? "",
        order_status: nextOrderStatus,
        is_paid: nextOrderStatus === "paid",
        paid_time: new Date(),
        total_amount: orderTotal,
        paid_amount: receivedAmount,
        change_amount: nextChangeAmount,
      });

      await createPayment({
        order_id: currentOrderRecord?.documentId ?? "",
        amount: receivedAmount,
        method: "cash",
        status: nextOrderStatus === "paid" ? "success" : "pending",
        paid_at: new Date(),
        currency: "VND",
      });

      await updateTableStatus({
        table_id: currentTableId,
        table_status: "Empty",
        occupied_since: null,
        last_cleared_at: new Date().toISOString(),
      });

      setOpenPaymentDrawer(false);
      const snapshot = buildReceiptSnapshot(
        orderTotal,
        receivedAmount,
        nextChangeAmount,
      );

      try {
        await printReceipt(snapshot);
        if (nextOrderStatus === "paid") {
          toast.success("Thanh toán thành công", {
            description: "Đơn hàng đã được thanh toán và gửi lệnh in hóa đơn.",
          });
        } else {
          toast.success("Đã chốt hóa đơn còn thiếu", {
            description: `Khách còn thiếu ${formattedNumber(remainingAmount)}.`,
          });
        }
      } catch (printError) {
        toast.success(
          nextOrderStatus === "paid"
            ? "Thanh toán thành công"
            : "Đã chốt hóa đơn còn thiếu",
          {
            description:
              printError instanceof Error
                ? `${printError.message} Bạn có thể in lại sau ở trang đơn hàng.`
                : "Không thể mở hộp thoại in. Bạn có thể in lại sau ở trang đơn hàng.",
          },
        );
      }
    } catch (error) {
      toast.error("Thanh toán thất bại", {
        description:
          error instanceof Error ? error.message : "Vui lòng thử lại.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSaveCustomerName = async () => {
    if (!currentOrderRecord?.documentId) {
      toast.error("Không tìm thấy đơn hàng để lưu tên khách.");
      return;
    }

    const nextCustomerName = customerNameInput.trim();
    const currentCustomerName = (currentOrderRecord.customer_name ?? "").trim();

    if (nextCustomerName === currentCustomerName) return;

    setIsSavingCustomerName(true);
    try {
      await updateOrderCustomerName({
        id: currentOrderRecord.documentId,
        customer_name: nextCustomerName,
      });
      toast.success("Đã lưu tên khách hàng.");
    } catch (error) {
      toast.error("Không thể lưu tên khách hàng", {
        description: error instanceof Error ? error.message : "Vui lòng thử lại.",
      });
    } finally {
      setIsSavingCustomerName(false);
    }
  };

  const handleRetry = async () => {
    if (!hasSelectedTable) return;
    await Promise.all([refetchOrderItems(), refetchCurrentOrder()]);
  };

  const isLoadingOrderItems =
    isOrderItemsInitialLoading || (isOrderItemsFetching && !listOrderItems);
  const isLoadingCurrentOrder =
    isCurrentOrderInitialLoading || (isCurrentOrderFetching && !currentOrder);
  const hasActiveOrderItems = displayedOrderItems.length > 0;

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
            <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <input
                type="text"
                value={customerNameInput}
                onChange={(event) => setCustomerNameInput(event.target.value)}
                placeholder="Tên khách hàng"
                disabled={!currentOrderRecord?.documentId}
                className="h-9 min-w-[260px] rounded-lg border border-[#e2ccb2] bg-white px-3 text-sm text-[#3f2b16] outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveCustomerName}
                disabled={
                  isSavingCustomerName || !currentOrderRecord?.documentId
                }
                className="h-9 border-[#e2ccb2] bg-white text-[#6f4b2a] hover:bg-[#fff2e2] hover:text-[#6f4b2a]"
              >
                {isSavingCustomerName ? "Đang lưu..." : "Lưu tên khách"}
              </Button>
            </div>
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
                    {formattedNumber(totalAmount)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Drawer
                    open={openPaymentDrawer}
                    onOpenChange={setOpenPaymentDrawer}
                    direction="right"
                  >
                    <Button
                      onClick={() => setOpenPaymentDrawer(true)}
                      className="h-12 min-w-[170px] rounded-xl bg-secondary px-6 text-base font-semibold text-white hover:bg-secondary/90 hover:text-white"
                    >
                      Thanh toán
                    </Button>
                    <DrawerContent className="w-full sm:max-w-3xl">
                      <DrawerHeader className="border-b border-[#ebdbc7] bg-[#fffaf4]">
                        <DrawerTitle className="text-2xl font-bold text-[#3f2b16]">
                          Xác nhận thanh toán bàn {currentTable}
                        </DrawerTitle>
                        <DrawerDescription className="text-[#7a5b3a]">
                          Kiểm tra lại thông tin hóa đơn trước khi in và chốt
                          thanh toán.
                        </DrawerDescription>
                      </DrawerHeader>

                      <div className="flex-1 overflow-y-auto p-5">
                        <div className="rounded-2xl border border-[#ead8c4] bg-white p-4">
                          <div className="grid gap-2 text-sm text-[#4a2f18] md:grid-cols-3">
                            <p>
                              <span className="font-semibold">Bàn:</span>{" "}
                              {currentTable}
                            </p>
                            <p>
                              <span className="font-semibold">Mã đơn:</span>{" "}
                              {currentOrderRecord?.order_no ??
                                currentOrderRecord?.documentId}
                            </p>
                            <p>
                              <span className="font-semibold">Số món:</span>{" "}
                              {displayedOrderItems.length}
                            </p>
                          </div>

                          <div className="mt-4 rounded-xl border border-[#f0dfcb] bg-[#fffaf5] p-3">
                            <label
                              htmlFor="customer-name"
                              className="text-sm font-semibold text-[#5a3b1f]"
                            >
                              Tên khách hàng
                            </label>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                              <input
                                id="customer-name"
                                type="text"
                                value={customerNameInput}
                                onChange={(event) =>
                                  setCustomerNameInput(event.target.value)
                                }
                                placeholder="Nhập tên khách (không bắt buộc)"
                                disabled={!currentOrderRecord?.documentId}
                                className="h-10 flex-1 rounded-lg border border-[#e2ccb2] bg-white px-3 text-sm text-[#3f2b16] outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleSaveCustomerName}
                                disabled={
                                  isSavingCustomerName ||
                                  !currentOrderRecord?.documentId
                                }
                                className="h-10 border-[#e2ccb2] bg-white text-[#6f4b2a] hover:bg-[#fff2e2] hover:text-[#6f4b2a]"
                              >
                                {isSavingCustomerName ? "Đang lưu..." : "Lưu tên"}
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 overflow-hidden rounded-xl border border-[#f0dfcb]">
                            <table className="w-full text-sm">
                              <thead className="bg-[#fff2e2] text-[#5a3b1f]">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold">
                                    Món
                                  </th>
                                  <th className="px-3 py-2 text-center font-semibold">
                                    SL
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold">
                                    Đơn giá
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold">
                                    Thành tiền
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {displayedOrderItems.map((item, index) => (
                                  <tr
                                    key={`${getOrderItemDocumentId(item)}-${index}`}
                                    className="border-t border-[#f6e8d8]"
                                  >
                                    <td className="px-3 py-2 text-[#3f2b16]">
                                      {getDishName(item.dish_id)}
                                    </td>
                                    <td className="px-3 py-2 text-center text-[#5d3e24]">
                                      {item.quantity}
                                    </td>
                                    <td className="px-3 py-2 text-right text-[#5d3e24]">
                                      {formattedNumber(item.price_at_order)}
                                    </td>
                                    <td className="px-3 py-2 text-right font-semibold text-secondary">
                                      {formattedNumber(
                                        item.price_at_order * item.quantity,
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-4 space-y-3">
                            <div className="rounded-xl border border-[#f0dfcb] bg-[#fffbf6] px-4 py-3">
                              <span className="text-sm font-semibold uppercase tracking-[0.14em] text-[#8b6a49]">
                                Tổng thanh toán
                              </span>
                              <span className="mt-2 block text-2xl font-bold text-secondary">
                                {formattedNumber(totalAmount)}
                              </span>
                            </div>

                            <div className="rounded-xl border border-[#f0dfcb] bg-[#fffaf5] px-4 py-3">
                              <label
                                htmlFor="paid-amount"
                                className="text-sm font-semibold text-[#5a3b1f]"
                              >
                                Tiền khách đưa
                              </label>
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  id="paid-amount"
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={paidAmountInput}
                                  onChange={(event) =>
                                    setPaidAmountInput(
                                      getDigitsOnly(event.target.value),
                                    )
                                  }
                                  className="h-10 w-full rounded-lg border border-[#e2ccb2] bg-white px-3 text-sm text-[#3f2b16] outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                                  placeholder="Nhập số tiền khách trả"
                                />
                                <span className="text-sm font-semibold text-[#7a5b3a]">
                                  VND
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-[#9a7c5e]">
                                {formattedNumber(paidAmountValue)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 rounded-xl border border-[#f0dfcb] bg-[#fffbf6] px-4 py-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-[#5a3b1f]">
                                {willMarkOutstanding ? "Còn thiếu" : "Tiền thối lại"}
                              </span>
                              <span
                                className={`text-lg font-bold ${
                                  willMarkOutstanding
                                    ? "text-rose-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {formattedNumber(
                                  willMarkOutstanding ? outstandingAmount : changeAmount,
                                )}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#8f7154]">
                              {willMarkOutstanding
                                ? "Đơn sẽ được lưu trạng thái Còn thiếu."
                                : "Đơn sẽ được lưu trạng thái Đã thanh toán."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <DrawerFooter className="border-t border-[#ebdbc7] bg-white">
                        <div className="flex flex-wrap justify-end gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 min-w-[140px] border-[#e0c9ad] bg-white text-[#6f4b2a] hover:bg-[#fff7ed] hover:text-[#6f4b2a]"
                            onClick={() => setOpenPaymentDrawer(false)}
                            disabled={isProcessingPayment}
                          >
                            Đóng
                          </Button>
                          <Button
                            type="button"
                            className="h-11 min-w-[210px] bg-primary text-primary-foreground hover:opacity-95"
                            onClick={() =>
                              handlePrintAndCheckout({ forceOutstanding: true })
                            }
                            disabled={isProcessingPayment}
                          >
                            <Printer className="mr-2 h-4 w-4 text-secondary" />
                            {isProcessingPayment
                              ? "Đang xử lý thanh toán..."
                              : "In hóa đơn & còn thiếu"}
                          </Button>
                          <Button
                            type="button"
                            className="h-11 min-w-[220px] bg-secondary text-white hover:bg-secondary/90 hover:text-white"
                            onClick={() => handlePrintAndCheckout()}
                            disabled={isProcessingPayment}
                          >
                            <Printer className="mr-2 h-4 w-4" />
                            {isProcessingPayment
                              ? "Đang xử lý thanh toán..."
                              : willMarkOutstanding
                                ? "In hóa đơn & lưu còn thiếu"
                                : "In hóa đơn & thanh toán"}
                          </Button>
                        </div>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>
                  <Button className="h-12 min-w-[150px] rounded-xl bg-orange-200 px-6 text-base font-semibold text-[#3f2b16] hover:bg-orange-200/90">
                    Tạm tính
                  </Button>
                </div>
              </div>
            </CardFooter>
          ) : null}
        </>
      )}

      <div className="pos-print-receipt-root" aria-hidden="true">
        {receiptSnapshot ? (
          <section className="pos-print-receipt-paper">
            <div className="pos-print-topline">
              <span>{receiptSnapshot.printedAt}</span>
              <span>{receiptSnapshot.website}</span>
            </div>

            <div className="pos-print-center">
              <p className="pos-print-store-line1">{RECEIPT_PROFILE.storeLine1}</p>
              <p className="pos-print-store-line2">{RECEIPT_PROFILE.storeLine2}</p>
              {RECEIPT_PROFILE.addressLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>ĐT: {RECEIPT_PROFILE.phone}</p>
            </div>

            <div className="pos-print-divider" />

            <div className="pos-print-center">
              <p className="pos-print-heading">HÓA ĐƠN BÁN HÀNG</p>
              <p>Số: {receiptSnapshot.orderNo}</p>
              <p>Bàn: {receiptSnapshot.tableLabel}</p>
            </div>

            <p className="pos-print-time">{receiptSnapshot.printedAt}</p>

            <div className="pos-print-customer">
              <p>Khách hàng: {receiptSnapshot.customerName}</p>
              <p>SĐT:</p>
              <p>Địa chỉ:</p>
            </div>

            <div className="pos-print-divider" />

            <table className="pos-print-table">
              <thead>
                <tr>
                  <th className="item-col">Đơn giá</th>
                  <th className="qty-col">SL</th>
                  <th className="total-col">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {receiptSnapshot.items.map((item, index) => (
                  <tr key={`${item.dishName}-${index}`}>
                    <td className="item-col">
                      <span className="pos-print-item-name">{item.dishName}</span>
                      <span className="pos-print-item-price">
                        {formatReceiptMoney(item.unitPrice)}
                      </span>
                    </td>
                    <td className="qty-col">{item.quantity}</td>
                    <td className="total-col">
                      {formatReceiptMoney(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pos-print-divider" />

            <div className="pos-print-summary">
              <p>
                <span>Cộng tiền hàng:</span>
                <strong>{formatReceiptMoney(receiptSnapshot.subtotal)}</strong>
              </p>
              <p>
                <span>Chiết khấu:</span>
                <strong>{formatReceiptMoney(receiptSnapshot.discount)}</strong>
              </p>
              <p className="grand-total">
                <span>Tổng cộng:</span>
                <strong>{formatReceiptMoney(receiptSnapshot.grandTotal)}</strong>
              </p>
              <p>
                <span>Tiền khách đưa:</span>
                <strong>{formatReceiptMoney(receiptSnapshot.paidAmount)}</strong>
              </p>
              {receiptSnapshot.paidAmount < receiptSnapshot.grandTotal ? (
                <p>
                  <span>Còn thiếu:</span>
                  <strong>
                    {formatReceiptMoney(
                      receiptSnapshot.grandTotal - receiptSnapshot.paidAmount,
                    )}
                  </strong>
                </p>
              ) : (
                <p>
                  <span>Tiền thừa:</span>
                  <strong>{formatReceiptMoney(receiptSnapshot.changeAmount)}</strong>
                </p>
              )}
            </div>

            <p className="pos-print-words">{receiptSnapshot.totalInWords}</p>
            <p className="pos-print-thanks">Cảm ơn và hẹn gặp lại!</p>
            <p className="pos-print-note">
              Thời hạn xuất hóa đơn từ 3 đến 5 ngày kể từ ngày thanh toán
            </p>
          </section>
        ) : null}
      </div>

      <style jsx global>{`
        .pos-print-receipt-root {
          display: none;
        }

        @page {
          margin: 1.5mm;
        }

        @media print {
          body * {
            visibility: hidden !important;
          }

          .pos-print-receipt-root,
          .pos-print-receipt-root * {
            visibility: visible !important;
          }

          .pos-print-receipt-root {
            display: block !important;
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: #fff;
          }
        }

        .pos-print-receipt-paper {
          width: 76mm;
          margin: 0 auto;
          color: #0f172a;
          font-family: "Arial", sans-serif;
          font-size: 12px;
          line-height: 1.32;
        }

        .pos-print-topline {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          font-size: 10px;
        }

        .pos-print-center {
          margin-top: 2px;
          text-align: center;
        }

        .pos-print-center p {
          margin: 0;
        }

        .pos-print-store-line1 {
          font-weight: 700;
          font-size: 19px;
          letter-spacing: 0.01em;
        }

        .pos-print-store-line2 {
          font-weight: 800;
          font-size: 33px;
          line-height: 1;
          letter-spacing: 0.03em;
          margin: 2px 0 4px;
        }

        .pos-print-divider {
          border-top: 1px dashed #444;
          margin: 6px 0;
        }

        .pos-print-heading {
          font-weight: 800;
          font-size: 15px;
          margin-bottom: 2px !important;
          letter-spacing: 0.02em;
        }

        .pos-print-time {
          margin: 2px 0 0;
          text-align: center;
          font-size: 11px;
        }

        .pos-print-customer {
          margin-top: 7px;
          line-height: 1.45;
        }

        .pos-print-customer p {
          margin: 0;
        }

        .pos-print-table {
          width: 100%;
          border-collapse: collapse;
        }

        .pos-print-table thead {
          border-bottom: 1px solid #111;
        }

        .pos-print-table tbody tr:not(:last-child) {
          border-bottom: 1px dotted #666;
        }

        .pos-print-table th,
        .pos-print-table td {
          padding: 4px 0;
          vertical-align: top;
          text-align: left;
        }

        .pos-print-table .item-col {
          width: 50%;
        }

        .pos-print-table .qty-col {
          width: 14%;
          text-align: center;
        }

        .pos-print-table .total-col {
          width: 36%;
          text-align: right;
          white-space: nowrap;
        }

        .pos-print-item-name {
          display: block;
          font-weight: 600;
          text-transform: uppercase;
        }

        .pos-print-item-price {
          display: block;
          margin-top: 1px;
          font-size: 11px;
          font-weight: 400;
        }

        .pos-print-summary {
          display: grid;
          gap: 2px;
        }

        .pos-print-summary p {
          margin: 0;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 8px;
        }

        .pos-print-summary .grand-total {
          font-size: 14px;
        }

        .pos-print-words {
          margin: 7px 0 0;
          font-style: italic;
          line-height: 1.35;
        }

        .pos-print-thanks {
          margin: 10px 0 0;
          text-align: center;
          font-size: 15px;
        }

        .pos-print-note {
          margin: 8px 0 0;
          text-align: center;
          font-size: 11px;
          line-height: 1.3;
          font-style: italic;
        }
      `}</style>
    </Card>
  );
};

export default ListMealsTable;
