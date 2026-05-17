'use client'

import React, { useCallback, useMemo, useState } from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { useAtom } from 'jotai'
import { ChevronDown, ChevronRight, Loader2, Printer } from 'lucide-react'

import { Order, OrderStatus } from '@/features/order/type'
import { useGetOrders, useUpdateOrderStatus } from '@/features/order/hook'
import { getOrderStatusMeta } from '@/features/order/status'
import { getOrderItemsByOrderId } from '@/features/order-items/services'
import { OrderItem } from '@/features/order-items/type'
import { formattedNumber } from '@/lib/format-vnd'
import { endDateFilterAtom, startDateFilterAtom, statusFilterAtom } from '@/lib/atom/orders/orders'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import OrderDetails from './order-details'
import { toast } from 'sonner'

const formatOrderDate = (value?: Date | string) => {
    if (!value) return "Chưa chốt"
    return new Date(value).toLocaleString("vi-VN", { hour12: false })
}

const resolveOrderCode = (order: Order) => order.order_no ?? order.documentId ?? "Không có mã"
const resolveOrderRowId = (order: Order, fallbackId: string) =>
    order.documentId ?? order.order_no ?? fallbackId
const EDITABLE_STATUS_OPTIONS: OrderStatus[] = [
    "paid",
    "outstanding",
    "cancelled",
    "refunded",
]

type PendingStatusChange = {
    order: Order
    nextStatus: OrderStatus
}

const RECEIPT_PROFILE = {
    storeLine1: "Quán Ăn Gia Đình",
    storeLine2: "THÙY LINH",
    addressLines: ["251A3 Đường A3, Hưng", "Phú, C. Thơ."],
    phone: "0918 663 065",
}

type ReceiptItemSnapshot = {
    dishName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

type ReceiptSnapshot = {
    printedAt: string;
    website: string;
    tableLabel: string;
    orderNo: string;
    customerName: string;
    statusLabel: string;
    items: ReceiptItemSnapshot[];
    grandTotal: number;
    paidAmount: number;
    changeAmount: number;
    outstandingAmount: number;
}

const formatReceiptDate = (value?: Date | string) => {
    const fallback = new Date()
    const date = value ? new Date(value) : fallback

    return date.toLocaleString("vi-VN", { hour12: false })
}

const formatReceiptMoney = (value: number) =>
    Math.max(0, Math.floor(value)).toLocaleString("vi-VN")

const escapeHtml = (rawValue: string) =>
    rawValue
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")

const renderReceiptHtml = (snapshot: ReceiptSnapshot) => {
    const rowsHtml = snapshot.items.map((item) => (
        `<tr>
            <td>
                <div class="name">${escapeHtml(item.dishName)}</div>
                <div class="price">${formatReceiptMoney(item.unitPrice)}</div>
            </td>
            <td class="center">${item.quantity}</td>
            <td class="right">${formatReceiptMoney(item.lineTotal)}</td>
        </tr>`
    )).join("")

    const statusSummaryHtml = snapshot.outstandingAmount > 0
        ? `<p><span>Còn thiếu:</span><strong>${formatReceiptMoney(snapshot.outstandingAmount)}</strong></p>`
        : `<p><span>Tiền thừa:</span><strong>${formatReceiptMoney(snapshot.changeAmount)}</strong></p>`

    return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>In lại hóa đơn</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        color: #0f172a;
      }
      .paper {
        width: 76mm;
        margin: 0 auto;
        padding: 8px 4px 14px;
        font-size: 12px;
        line-height: 1.35;
      }
      .topline {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        font-size: 10px;
      }
      .center { text-align: center; }
      .right { text-align: right; }
      .store-line1 {
        margin: 2px 0 0;
        font-size: 19px;
        font-weight: 700;
      }
      .store-line2 {
        margin: 0;
        font-size: 31px;
        line-height: 1;
        font-weight: 800;
      }
      p { margin: 0; }
      .divider {
        margin: 6px 0;
        border-top: 1px dashed #444;
      }
      .heading {
        font-size: 15px;
        font-weight: 800;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 4px;
      }
      th, td {
        border-bottom: 1px dashed #d4d4d4;
        padding: 4px 2px;
        vertical-align: top;
      }
      th {
        font-weight: 700;
      }
      td.center, th.center { text-align: center; }
      td.right, th.right { text-align: right; }
      .name { font-weight: 600; }
      .price { font-size: 11px; color: #525252; }
      .summary {
        margin-top: 6px;
      }
      .summary p {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin: 1px 0;
      }
      .thanks {
        margin-top: 10px;
        text-align: center;
        font-weight: 700;
      }
      @page {
        margin: 1.5mm;
      }
    </style>
  </head>
  <body>
    <section class="paper">
      <div class="topline">
        <span>${escapeHtml(snapshot.printedAt)}</span>
        <span>${escapeHtml(snapshot.website)}</span>
      </div>

      <div class="center">
        <p class="store-line1">${escapeHtml(RECEIPT_PROFILE.storeLine1)}</p>
        <p class="store-line2">${escapeHtml(RECEIPT_PROFILE.storeLine2)}</p>
        ${RECEIPT_PROFILE.addressLines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
        <p>ĐT: ${escapeHtml(RECEIPT_PROFILE.phone)}</p>
      </div>

      <div class="divider"></div>

      <div class="center">
        <p class="heading">HÓA ĐƠN BÁN HÀNG</p>
        <p>Số: ${escapeHtml(snapshot.orderNo)}</p>
        <p>Bàn: ${escapeHtml(snapshot.tableLabel)}</p>
      </div>

      <p style="margin-top:4px">Khách hàng: ${escapeHtml(snapshot.customerName)}</p>
      <p>Trạng thái: ${escapeHtml(snapshot.statusLabel)}</p>

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th>Tên món</th>
            <th class="center">SL</th>
            <th class="right">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || `<tr><td colspan="3" class="center">Không có dữ liệu món</td></tr>`}
        </tbody>
      </table>

      <div class="summary">
        <p><span>Tổng cộng:</span><strong>${formatReceiptMoney(snapshot.grandTotal)}</strong></p>
        <p><span>Tiền khách đưa:</span><strong>${formatReceiptMoney(snapshot.paidAmount)}</strong></p>
        ${statusSummaryHtml}
      </div>

      <p class="thanks">Cảm ơn và hẹn gặp lại!</p>
    </section>
  </body>
</html>`
}

const OrdersTableSkeleton = () => (
    <div className='space-y-4'>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className='rounded-2xl border border-[#ead8c4] bg-white p-4 shadow-sm'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='mt-3 h-8 w-28' />
                    <Skeleton className='mt-2 h-3 w-24' />
                </div>
            ))}
        </div>
        <div className='overflow-hidden rounded-2xl border border-[#ead8c4] bg-white'>
            <div className='space-y-3 p-4'>
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-full' />
            </div>
        </div>
    </div>
)

const OrdersTable = () => {
    const [statusFilter] = useAtom(statusFilterAtom)
    const [startDateFilter] = useAtom(startDateFilterAtom)
    const [endDateFilter] = useAtom(endDateFilterAtom)
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
    const [printingOrderId, setPrintingOrderId] = useState<string | null>(null)
    const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null)
    const [changingStatusOrderId, setChangingStatusOrderId] = useState<string | null>(null)
    const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus()

    const {
        data: listOrders,
        isLoading: isOrdersLoading,
        isFetching: isOrdersFetching,
        isError: isOrdersError,
        refetch: refetchOrders,
    } = useGetOrders({
        order_status: statusFilter,
        start_date: startDateFilter,
        end_date: endDateFilter,
    })

    const rawOrders: Order[] = listOrders?.data ?? []
    const orders = useMemo(
        () => rawOrders.filter((order) => order.order_status !== "active"),
        [rawOrders],
    )
    const hasOrders = orders.length > 0
    const isInitialLoading = isOrdersLoading && !hasOrders
    const isBackgroundFetching = isOrdersFetching && hasOrders

    const summary = useMemo(() => {
        const totalOrders = orders.length
        const paidOrders = orders.filter((order) => order.order_status === "paid").length
        const outstandingOrders = orders.filter((order) => order.order_status === "outstanding").length
        const totalRevenue = orders.reduce(
            (sum, order) => sum + (order.total_amount ?? 0),
            0,
        )

        return {
            totalOrders,
            paidOrders,
            outstandingOrders,
            totalRevenue,
        }
    }, [orders])

    const requestStatusChange = useCallback((order: Order, nextStatus: OrderStatus) => {
        const currentStatus = order.order_status
        if (currentStatus === nextStatus) return
        if (currentStatus === "paid") return
        if (!EDITABLE_STATUS_OPTIONS.includes(nextStatus)) return

        setPendingStatusChange({ order, nextStatus })
    }, [])

    const handleConfirmStatusChange = useCallback(async () => {
        if (!pendingStatusChange) return

        const { order, nextStatus } = pendingStatusChange
        const orderId = order.documentId

        if (!orderId) {
            toast.error("Không tìm thấy mã hóa đơn để cập nhật trạng thái.")
            setPendingStatusChange(null)
            return
        }

        const isPaid = nextStatus === "paid"
        const nextPaidTime = isPaid
            ? (order.paid_time ?? order.closed_at ?? new Date().toISOString())
            : order.paid_time

        setChangingStatusOrderId(orderId)

        try {
            await updateOrderStatus({
                id: orderId,
                order_status: nextStatus,
                is_paid: isPaid,
                paid_time: nextPaidTime,
            })
            await refetchOrders()

            toast.success("Cập nhật trạng thái thành công", {
                description: `Đơn ${resolveOrderCode(order)} đã đổi sang "${getOrderStatusMeta(nextStatus).label}".`,
            })
            setPendingStatusChange(null)
        } catch (error) {
            toast.error("Không thể cập nhật trạng thái", {
                description: error instanceof Error ? error.message : "Vui lòng thử lại.",
            })
        } finally {
            setChangingStatusOrderId(null)
        }
    }, [pendingStatusChange, refetchOrders, updateOrderStatus])

    const handleReprintOrder = useCallback(async (order: Order) => {
        const orderId = order.documentId
        if (!orderId) {
            toast.error("Không tìm thấy mã đơn để in lại hóa đơn.")
            return
        }

        setPrintingOrderId(orderId)
        let printWindow: Window | null = null

        try {
            printWindow = window.open("", "_blank")
            if (!printWindow) {
                throw new Error("Trình duyệt đã chặn cửa sổ in.")
            }

            printWindow.document.open()
            printWindow.document.write(`
                <html>
                  <head><title>Đang chuẩn bị hóa đơn...</title></head>
                  <body style="font-family: Arial, sans-serif; padding: 16px;">Đang chuẩn bị hóa đơn...</body>
                </html>
            `)
            printWindow.document.close()

            const response = await getOrderItemsByOrderId({
                "filters[order_id][documentId][$eq]": orderId,
                "populate[0]": "order_id",
                "populate[1]": "dish_id",
                "sort": "createdAt:asc",
            })

            const orderItems: OrderItem[] = response?.data ?? []
            const items: ReceiptItemSnapshot[] = orderItems.map((item) => {
                const dishNameFromRelation =
                    typeof item.dish_id === "string"
                        ? item.dish_id
                        : item.dish_id?.name

                const dishName =
                    item.dish_name_snapshot ??
                    dishNameFromRelation ??
                    "Món không xác định"

                const unitPrice = item.price_at_order ?? 0
                const quantity = item.quantity ?? 0

                return {
                    dishName,
                    quantity,
                    unitPrice,
                    lineTotal: unitPrice * quantity,
                }
            })

            const calculatedTotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
            const grandTotal = order.total_amount ?? calculatedTotal
            const paidAmount = order.paid_amount ?? (order.order_status === "paid" ? grandTotal : 0)
            const changeAmount = order.change_amount ?? Math.max(paidAmount - grandTotal, 0)
            const outstandingAmount = Math.max(grandTotal - paidAmount, 0)
            const statusLabel = getOrderStatusMeta(order.order_status).label

            const snapshot: ReceiptSnapshot = {
                printedAt: formatReceiptDate(order.paid_time ?? order.closed_at ?? order.updatedAt ?? order.createdAt),
                website: typeof window !== "undefined" ? window.location.host : "www.pos360.vn",
                tableLabel: order.table_id?.tableNumber ?? "Mang về",
                orderNo: resolveOrderCode(order),
                customerName: order.customer_name?.trim() || "Khách lẻ",
                statusLabel,
                items,
                grandTotal,
                paidAmount,
                changeAmount,
                outstandingAmount,
            }

            if (!printWindow) {
                throw new Error("Không thể mở cửa sổ in.")
            }

            const readyWindow = printWindow
            readyWindow.document.open()
            readyWindow.document.write(renderReceiptHtml(snapshot))
            readyWindow.document.close()
            let hasPrinted = false
            const triggerPrint = () => {
                if (hasPrinted || readyWindow.closed) return
                hasPrinted = true
                readyWindow.focus()
                readyWindow.print()
                readyWindow.onafterprint = () => readyWindow.close()
                window.setTimeout(() => {
                    if (!readyWindow.closed) {
                        readyWindow.close()
                    }
                }, 800)
            }

            readyWindow.onload = triggerPrint
            window.setTimeout(triggerPrint, 250)

            toast.success("Đã mở hóa đơn để in lại.")
        } catch (error) {
            toast.error("Không thể in lại hóa đơn", {
                description:
                    error instanceof Error ? error.message : "Vui lòng thử lại.",
            })
            if (printWindow && !printWindow.closed) {
                printWindow.close()
            }
        } finally {
            setPrintingOrderId(null)
        }
    }, [])

    const columns = useMemo<ColumnDef<Order>[]>(() => [
        {
            accessorKey: "documentId",
            header: "Mã hóa đơn",
            cell: ({ row }) => (
                <div className='max-w-[240px] truncate font-semibold text-[#3f2b16]'>
                    {resolveOrderCode(row.original)}
                </div>
            ),
        },
        {
            accessorKey: "table",
            header: "Số bàn",
            cell: ({ row }) => {
                const tableNumber = row.original.table_id?.tableNumber
                return (
                    <span className='inline-flex rounded-full border border-[#ecdac7] bg-[#fffaf3] px-3 py-1 text-xs font-semibold text-[#6a4a2d]'>
                        {tableNumber ? `Bàn ${tableNumber}` : "Mang về"}
                    </span>
                )
            },
        },
        {
            accessorKey: "paid_time",
            header: "Ngày bán",
            cell: ({ row }) => (
                <span className='text-sm text-[#5f4228]'>
                    {formatOrderDate(row.original.paid_time ?? row.original.closed_at ?? row.original.updatedAt)}
                </span>
            ),
        },
        {
            accessorKey: "total_amount",
            header: "Tổng tiền",
            cell: ({ row }) => (
                <span className='text-base font-bold text-secondary'>
                    {formattedNumber(row.original.total_amount ?? 0)}
                </span>
            ),
        },
        {
            accessorKey: "order_status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const currentStatus = row.original.order_status
                const statusMeta = getOrderStatusMeta(currentStatus)
                const canChangeStatus =
                    currentStatus !== "paid" &&
                    EDITABLE_STATUS_OPTIONS.includes(currentStatus as OrderStatus)
                const isChangingThisOrder =
                    changingStatusOrderId === (row.original.documentId ?? null)

                if (!canChangeStatus) {
                    return (
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}>
                            {statusMeta.label}
                        </span>
                    )
                }

                return (
                    <div
                        className='inline-flex items-center gap-2'
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        <Select
                            value={currentStatus}
                            onValueChange={(value) =>
                                requestStatusChange(row.original, value as OrderStatus)
                            }
                            disabled={isChangingThisOrder}
                        >
                            <SelectTrigger
                                className={`h-8 min-w-[150px] rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}
                                aria-label='Đổi trạng thái hóa đơn'
                            >
                                {isChangingThisOrder ? (
                                    <span className='inline-flex items-center gap-1.5'>
                                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                        Đang lưu
                                    </span>
                                ) : (
                                    <SelectValue />
                                )}
                            </SelectTrigger>
                            <SelectContent>
                                {EDITABLE_STATUS_OPTIONS.map((statusOption) => (
                                    <SelectItem key={statusOption} value={statusOption}>
                                        {getOrderStatusMeta(statusOption).label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )
            },
        },
        {
            accessorKey: "action",
            header: "Chi tiết",
            cell: ({ row }) => {
                const orderRowId = resolveOrderRowId(row.original, row.id)
                const isExpanded = expandedOrderId === orderRowId
                const isPrintingThisOrder = printingOrderId === (row.original.documentId ?? null)

                return (
                    <div className='inline-flex items-center gap-2'>
                        <button
                            type='button'
                            className='inline-flex items-center gap-1.5 rounded-md border border-[#e3cfb8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#6f4b2a] transition hover:bg-[#fff4e5] disabled:cursor-not-allowed disabled:opacity-60'
                            onClick={(event) => {
                                event.stopPropagation()
                                handleReprintOrder(row.original)
                            }}
                            disabled={isPrintingThisOrder}
                        >
                            {isPrintingThisOrder ? (
                                <Loader2 className='h-4 w-4 animate-spin' />
                            ) : (
                                <Printer className='h-4 w-4' />
                            )}
                            In hóa đơn
                        </button>
                        <button
                            type='button'
                            className='inline-flex items-center gap-1.5 rounded-md border border-[#e3cfb8] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#6f4b2a] transition hover:bg-[#fff4e5]'
                            onClick={(event) => {
                                event.stopPropagation()
                                setExpandedOrderId(isExpanded ? null : orderRowId)
                            }}
                        >
                            {isExpanded ? (
                                <ChevronDown className='h-4 w-4' />
                            ) : (
                                <ChevronRight className='h-4 w-4' />
                            )}
                            {isExpanded ? "Ẩn" : "Xem"}
                        </button>
                    </div>
                )
            }
        }
    ], [changingStatusOrderId, expandedOrderId, handleReprintOrder, printingOrderId, requestStatusChange])

    const table = useReactTable({
        data: orders,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    if (isInitialLoading) return <OrdersTableSkeleton />

    if (isOrdersError) {
        return (
            <div className='rounded-2xl border border-[#efc8c8] bg-[#fff7f7] p-5'>
                <p className='text-sm font-semibold text-[#a03232]'>
                    Không thể tải danh sách đơn hàng.
                </p>
                <Button
                    type='button'
                    variant='outline'
                    onClick={() => refetchOrders()}
                    className='mt-3 border-[#e4b9b9] bg-white text-[#8f3434] hover:bg-[#fff0f0] hover:text-[#8f3434]'
                >
                    Tải lại
                </Button>
            </div>
        )
    }

    return (
        <div className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <div className='rounded-2xl border border-[#ead8c4] bg-white p-4 shadow-sm'>
                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[#9b7757]'>Tổng đơn</p>
                    <p className='mt-2 text-3xl font-bold text-[#4a2f18]'>{summary.totalOrders}</p>
                    <p className='mt-1 text-xs text-[#9b7757]'>Đơn theo bộ lọc hiện tại</p>
                </div>
                <div className='rounded-2xl border border-[#ead8c4] bg-white p-4 shadow-sm'>
                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[#9b7757]'>Đã thanh toán</p>
                    <p className='mt-2 text-3xl font-bold text-emerald-700'>{summary.paidOrders}</p>
                    <p className='mt-1 text-xs text-[#9b7757]'>Đơn hoàn tất công nợ</p>
                </div>
                <div className='rounded-2xl border border-[#ead8c4] bg-white p-4 shadow-sm'>
                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[#9b7757]'>Còn thiếu</p>
                    <p className='mt-2 text-3xl font-bold text-rose-700'>{summary.outstandingOrders}</p>
                    <p className='mt-1 text-xs text-[#9b7757]'>Đơn đã in hóa đơn nhưng chưa đủ tiền</p>
                </div>
                <div className='rounded-2xl border border-[#ead8c4] bg-white p-4 shadow-sm'>
                    <p className='text-xs font-semibold uppercase tracking-[0.16em] text-[#9b7757]'>Doanh thu</p>
                    <p className='mt-2 text-3xl font-bold text-secondary'>{formattedNumber(summary.totalRevenue)}</p>
                    <p className='mt-1 text-xs text-[#9b7757]'>VND</p>
                </div>
            </div>

            <div className='relative overflow-hidden rounded-2xl border border-[#ead8c4] bg-white shadow-sm'>
                {isBackgroundFetching ? (
                    <div className='absolute inset-0 z-20 flex items-center justify-center bg-white/70'>
                        <div className='inline-flex items-center gap-2 rounded-full border border-[#e6d4be] bg-white px-4 py-2 text-sm font-semibold text-[#6f4b2a]'>
                            <Loader2 className='h-4 w-4 animate-spin' />
                            Đang cập nhật dữ liệu...
                        </div>
                    </div>
                ) : null}

                <Table>
                    <TableHeader className='bg-gradient-to-r from-[#fff6e9] via-[#fff9f1] to-[#fffdf8]'>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className='border-[#ecdac7] hover:bg-transparent'>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className='px-6 py-4 text-sm font-bold text-[#5d4024]'>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => {
                                const orderRowId = resolveOrderRowId(row.original, row.id)
                                const isExpanded = expandedOrderId === orderRowId

                                return (
                                    <React.Fragment key={orderRowId}>
                                        <TableRow
                                            data-state={row.getIsSelected() && "selected"}
                                            onClick={() => setExpandedOrderId(isExpanded ? null : orderRowId)}
                                            className='cursor-pointer border-[#f3e8da] bg-white hover:bg-[#fffaf3]'
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className='px-6 py-4 text-sm text-[#3f2b16]'>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {isExpanded ? (
                                            <TableRow className='border-[#f0e2d1] bg-[#fffdf9]'>
                                                <TableCell colSpan={columns.length} className="px-6 py-4">
                                                    <OrderDetails
                                                        order={row.original}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ) : null}
                                    </React.Fragment>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-28 text-center text-sm font-medium text-[#8d6b4a]">
                                    Không có đơn hàng phù hợp với bộ lọc hiện tại.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog
                open={Boolean(pendingStatusChange)}
                onOpenChange={(open) => {
                    if (!open && !changingStatusOrderId) {
                        setPendingStatusChange(null)
                    }
                }}
            >
                <DialogContent className='border-[#ead8c4] bg-white sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle className='text-[#4a2f18]'>
                            Xác nhận đổi trạng thái
                        </DialogTitle>
                        <DialogDescription className='text-[#7a5b3a]'>
                            {pendingStatusChange
                                ? `Bạn có chắc muốn đổi đơn ${resolveOrderCode(pendingStatusChange.order)} từ "${getOrderStatusMeta(pendingStatusChange.order.order_status).label}" sang "${getOrderStatusMeta(pendingStatusChange.nextStatus).label}"?`
                                : "Xác nhận cập nhật trạng thái hóa đơn."}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button
                            type='button'
                            variant='outline'
                            onClick={() => setPendingStatusChange(null)}
                            disabled={Boolean(changingStatusOrderId)}
                            className='border-[#e3cfb8] bg-white text-[#6f4b2a] hover:bg-[#fff4e5] hover:text-[#6f4b2a]'
                        >
                            Hủy
                        </Button>
                        <Button
                            type='button'
                            onClick={handleConfirmStatusChange}
                            disabled={Boolean(changingStatusOrderId)}
                            className='bg-secondary text-white hover:bg-secondary/90 hover:text-white'
                        >
                            {changingStatusOrderId ? (
                                <span className='inline-flex items-center gap-2'>
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                    Đang cập nhật...
                                </span>
                            ) : (
                                "Xác nhận đổi"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default OrdersTable
