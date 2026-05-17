'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import {
    ArrowLeft,
    Loader2,
    Minus,
    Plus,
    Printer,
    RefreshCcw,
    UtensilsCrossed,
} from 'lucide-react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table'

import { useCreateOrderItem, useGetOrderItemsByOrderId, useUpdateOrderItemQuantity } from '@/features/order-items/hook'
import { OrderItem } from '@/features/order-items/type'
import { useGetAllCategories } from '@/features/categories/hook'
import { Category } from '@/features/categories/type'
import { useGetDishesByCategory } from '@/features/dish/hook'
import { Dish } from '@/features/dish/type'
import { useUpdateOrderCustomerName, useUpdateOrderStatus } from '@/features/order/hook'
import { getOrderStatusMeta } from '@/features/order/status'
import { Order, OrderStatus } from '@/features/order/type'
import { useCreatePayment } from '@/features/payments/hook'
import { formattedNumber } from '@/lib/format-vnd'
import { STRAPI_BASE_URL } from '@/lib/strapi-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const resolveDishNameFromOrderItem = (item: OrderItem) => {
    if (item.dish_name_snapshot) return item.dish_name_snapshot
    if (typeof item.dish_id === 'string') return item.dish_id
    return item.dish_id?.name ?? 'Không rõ món'
}

const resolveDishIdFromOrderItem = (item: OrderItem) => {
    if (typeof item.dish_id === 'string') return ''
    return item.dish_id?.documentId ?? ''
}

const resolveOrderItemDocumentId = (item: OrderItem) =>
    item.documentId ?? (typeof item.id === 'number' ? String(item.id) : '')

const columns: ColumnDef<OrderItem>[] = [
    {
        accessorKey: 'index',
        header: 'STT',
        cell: ({ row }) => row.index + 1,
    },
    {
        accessorKey: 'name',
        header: 'Tên sản phẩm',
        cell: ({ row }) => resolveDishNameFromOrderItem(row.original),
    },
    {
        accessorKey: 'quantity',
        header: 'Số lượng',
    },
    {
        accessorKey: 'price_at_order',
        header: 'Đơn giá',
        cell: ({ row }) => formattedNumber(row.original.price_at_order || 0),
    },
    {
        accessorKey: 'total_price',
        header: 'Thành tiền',
        cell: ({ row }) => {
            const quantity = row.original.quantity || 0
            const priceAtOrder = row.original.price_at_order || 0
            return formattedNumber(quantity * priceAtOrder)
        },
    },
]

type PendingDishSelection = {
    dishId: string
    dish: Dish
    quantity: number
    unitPrice: number
}

type ReceiptItemSnapshot = {
    dishName: string
    quantity: number
    unitPrice: number
    lineTotal: number
}

type ReceiptSnapshot = {
    printedAt: string
    website: string
    tableLabel: string
    orderNo: string
    customerName: string
    statusLabel: string
    items: ReceiptItemSnapshot[]
    grandTotal: number
    paidAmount: number
    changeAmount: number
    outstandingAmount: number
}

const RECEIPT_PROFILE = {
    storeLine1: 'Quán Ăn Gia Đình',
    storeLine2: 'THÙY LINH',
    addressLines: ['251A3 Đường A3, Hưng', 'Phú, C. Thơ.'],
    phone: '0918 663 065',
}

const formatReceiptMoney = (value: number) =>
    Math.max(0, Math.floor(value)).toLocaleString('vi-VN')

const formatReceiptDate = (value?: Date | string) => {
    const fallback = new Date()
    const date = value ? new Date(value) : fallback

    return date.toLocaleString('vi-VN', { hour12: false })
}

const escapeHtml = (rawValue: string) =>
    rawValue
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')

const getDigitsOnly = (value: string) => value.replace(/[^\d]/g, '')

const parseMoneyInput = (value: string) => {
    const normalized = getDigitsOnly(value)
    if (!normalized) return 0

    const parsed = Number.parseInt(normalized, 10)
    return Number.isNaN(parsed) ? 0 : parsed
}

const renderReceiptHtml = (snapshot: ReceiptSnapshot) => {
    const rowsHtml = snapshot.items
        .map(
            (item) =>
                `<tr>
            <td>
                <div class="name">${escapeHtml(item.dishName)}</div>
                <div class="price">${formatReceiptMoney(item.unitPrice)}</div>
            </td>
            <td class="center">${item.quantity}</td>
            <td class="right">${formatReceiptMoney(item.lineTotal)}</td>
        </tr>`,
        )
        .join('')

    const statusSummaryHtml =
        snapshot.outstandingAmount > 0
            ? `<p><span>Còn thiếu:</span><strong>${formatReceiptMoney(snapshot.outstandingAmount)}</strong></p>`
            : `<p><span>Tiền thừa:</span><strong>${formatReceiptMoney(snapshot.changeAmount)}</strong></p>`

    return `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>In hóa đơn</title>
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
        ${RECEIPT_PROFILE.addressLines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}
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

const OrderDetails = ({ order }: { order: Order }) => {
    const orderId = order.documentId ?? ''
    const orderTableLabel = order.table_id?.tableNumber ?? '-'
    const [selectedCategory, setSelectedCategory] = useState('')

    const {
        data: orderDetails,
        isLoading: isOrderDetailsLoading,
        isFetching: isOrderDetailsFetching,
        isError: isOrderDetailsError,
        refetch: refetchOrderDetails,
    } = useGetOrderItemsByOrderId(orderId)

    const {
        data: categoriesResponse,
        isInitialLoading: isCategoriesInitialLoading,
        isFetching: isCategoriesFetching,
        isError: isCategoriesError,
        refetch: refetchCategories,
    } = useGetAllCategories()

    const {
        data: dishesResponse,
        isInitialLoading: isDishesInitialLoading,
        isFetching: isDishesFetching,
        isError: isDishesError,
        refetch: refetchDishes,
    } = useGetDishesByCategory(selectedCategory)

    const { mutateAsync: createOrderItem } = useCreateOrderItem()
    const { mutateAsync: updateOrderItemQuantity } = useUpdateOrderItemQuantity()
    const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus()
    const { mutateAsync: updateOrderCustomerName } = useUpdateOrderCustomerName()
    const { mutateAsync: createPayment } = useCreatePayment()

    const [openAddDrawer, setOpenAddDrawer] = useState(false)
    const [openCheckoutDrawer, setOpenCheckoutDrawer] = useState(false)
    const [pendingSelections, setPendingSelections] = useState<Record<string, PendingDishSelection>>({})
    const [isSavingAddedItems, setIsSavingAddedItems] = useState(false)
    const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
    const [isSavingCustomerName, setIsSavingCustomerName] = useState(false)
    const [customerNameInput, setCustomerNameInput] = useState(order.customer_name ?? '')
    const [paidAmountInput, setPaidAmountInput] = useState('')
    const [latestPaidAmount, setLatestPaidAmount] = useState(order.paid_amount ?? 0)
    const [latestStatus, setLatestStatus] = useState<OrderStatus>(order.order_status)

    useEffect(() => {
        setCustomerNameInput(order.customer_name ?? '')
        setLatestPaidAmount(order.paid_amount ?? 0)
        setLatestStatus(order.order_status)
    }, [order.customer_name, order.documentId, order.order_status, order.paid_amount])

    useEffect(() => {
        if (!openCheckoutDrawer) return

        const nextPaidAmount = latestPaidAmount > 0 ? latestPaidAmount : 0
        setPaidAmountInput(String(nextPaidAmount))
    }, [latestPaidAmount, openCheckoutDrawer])

    const data: OrderItem[] = orderDetails?.data ?? []
    const categories: Category[] = categoriesResponse?.data ?? []
    const dishes: Dish[] = dishesResponse?.data ?? []

    const isInitialLoading = isOrderDetailsLoading && !orderDetails
    const isBackgroundFetching = isOrderDetailsFetching && Boolean(orderDetails)

    const totalAmount = useMemo(
        () =>
            data.reduce((total, item) => {
                const priceAtOrder = item.price_at_order || 0
                return total + (item.quantity || 0) * priceAtOrder
            }, 0),
        [data],
    )

    const paidAmountValue = useMemo(() => parseMoneyInput(paidAmountInput), [paidAmountInput])
    const outstandingAmount = Math.max(totalAmount - paidAmountValue, 0)
    const changeAmount = Math.max(paidAmountValue - totalAmount, 0)
    const willMarkOutstanding = paidAmountValue < totalAmount

    const existingOrderItemsByDishId = useMemo(() => {
        const map = new Map<string, OrderItem>()

        data.forEach((item) => {
            const dishId = resolveDishIdFromOrderItem(item)
            if (dishId) {
                map.set(dishId, item)
            }
        })

        return map
    }, [data])

    const pendingSelectionsList = useMemo(
        () => Object.values(pendingSelections),
        [pendingSelections],
    )

    const pendingSelectionsCount = useMemo(
        () =>
            pendingSelectionsList.reduce(
                (sum, item) => sum + item.quantity,
                0,
            ),
        [pendingSelectionsList],
    )

    const pendingSelectionsTotal = useMemo(
        () =>
            pendingSelectionsList.reduce(
                (sum, item) => sum + item.quantity * item.unitPrice,
                0,
            ),
        [pendingSelectionsList],
    )

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const resolveDishImageUrl = (dish: Dish) => {
        if (!dish?.image?.url) {
            return '/category-food-placeholder.svg'
        }

        return dish.image.url.startsWith('http')
            ? dish.image.url
            : `${STRAPI_BASE_URL}${dish.image.url}`
    }

    const resolveDishUnitPrice = (dish: Dish) => {
        const tableName = orderTableLabel.toLowerCase()

        if (tableName.includes('vip')) {
            return dish.price ?? dish.vipPrice ?? 0
        }

        return dish.vipPrice ?? dish.price ?? 0
    }

    const updatePendingSelection = (dishId: string, nextQuantity: number) => {
        setPendingSelections((prev) => {
            if (nextQuantity <= 0) {
                const next = { ...prev }
                delete next[dishId]
                return next
            }

            const current = prev[dishId]
            if (!current) return prev

            return {
                ...prev,
                [dishId]: {
                    ...current,
                    quantity: nextQuantity,
                },
            }
        })
    }

    const addDishToPendingSelection = (dish: Dish) => {
        const dishId = dish.documentId

        if (!dishId) {
            toast.error('Không tìm thấy mã món để thêm vào hóa đơn.')
            return
        }

        const unitPrice = resolveDishUnitPrice(dish)

        setPendingSelections((prev) => {
            const current = prev[dishId]
            if (current) {
                return {
                    ...prev,
                    [dishId]: {
                        ...current,
                        quantity: current.quantity + 1,
                    },
                }
            }

            return {
                ...prev,
                [dishId]: {
                    dishId,
                    dish,
                    quantity: 1,
                    unitPrice,
                },
            }
        })

        toast.success(`Đã chọn thêm món ${dish.name}`)
    }

    const resetAddDrawerState = () => {
        setPendingSelections({})
        setSelectedCategory('')
    }

    const handleOpenAddDrawer = () => {
        if (!orderId) {
            toast.error('Không tìm thấy mã hóa đơn để chỉnh sửa.')
            return
        }

        resetAddDrawerState()
        setOpenAddDrawer(true)
    }

    const handleSaveAddedItems = async () => {
        if (!orderId) {
            toast.error('Không tìm thấy mã hóa đơn để thêm món.')
            return
        }

        if (!pendingSelectionsList.length) {
            toast.warning('Bạn chưa chọn món để thêm vào hóa đơn.')
            return
        }

        setIsSavingAddedItems(true)

        try {
            for (const pendingItem of pendingSelectionsList) {
                const existingItem = existingOrderItemsByDishId.get(pendingItem.dishId)

                if (existingItem) {
                    const existingOrderItemId = resolveOrderItemDocumentId(existingItem)
                    if (!existingOrderItemId) {
                        throw new Error('Không tìm thấy mã món hiện có để cập nhật số lượng.')
                    }

                    await updateOrderItemQuantity({
                        id: existingOrderItemId,
                        quantity: (existingItem.quantity ?? 0) + pendingItem.quantity,
                    })
                } else {
                    await createOrderItem({
                        dish_id: pendingItem.dishId,
                        order_id: orderId,
                        quantity: pendingItem.quantity,
                        price_at_order: pendingItem.unitPrice,
                    })
                }
            }

            await refetchOrderDetails()
            setOpenAddDrawer(false)
            resetAddDrawerState()
            setOpenCheckoutDrawer(true)

            toast.success('Đã thêm món vào hóa đơn.', {
                description: 'Kiểm tra và in/chốt lại hóa đơn để cập nhật công nợ.',
            })
        } catch (error) {
            toast.error('Không thể thêm món vào hóa đơn', {
                description:
                    error instanceof Error ? error.message : 'Vui lòng thử lại.',
            })
        } finally {
            setIsSavingAddedItems(false)
        }
    }

    const handleSaveCustomerName = async () => {
        if (!orderId) {
            toast.error('Không tìm thấy mã hóa đơn để lưu tên khách.')
            return
        }

        const nextCustomerName = customerNameInput.trim()
        const currentCustomerName = (order.customer_name ?? '').trim()

        if (nextCustomerName === currentCustomerName) return

        setIsSavingCustomerName(true)
        try {
            await updateOrderCustomerName({
                id: orderId,
                customer_name: nextCustomerName,
            })
            toast.success('Đã lưu tên khách hàng.')
        } catch (error) {
            toast.error('Không thể lưu tên khách hàng', {
                description:
                    error instanceof Error ? error.message : 'Vui lòng thử lại.',
            })
        } finally {
            setIsSavingCustomerName(false)
        }
    }

    const openPrintWindowWithSnapshot = async (snapshot: ReceiptSnapshot) => {
        let printWindow: Window | null = null

        try {
            printWindow = window.open('', '_blank')
            if (!printWindow) {
                throw new Error('Trình duyệt đã chặn cửa sổ in.')
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

                readyWindow.onafterprint = () => {
                    if (!readyWindow.closed) {
                        readyWindow.close()
                    }
                }

                window.setTimeout(() => {
                    if (!readyWindow.closed) {
                        readyWindow.close()
                    }
                }, 900)
            }

            readyWindow.onload = triggerPrint
            window.setTimeout(triggerPrint, 260)
        } catch (error) {
            if (printWindow && !printWindow.closed) {
                printWindow.close()
            }
            throw error
        }
    }

    const buildReceiptSnapshot = (
        nextStatus: OrderStatus,
        finalPaidAmount: number,
        finalChangeAmount: number,
    ): ReceiptSnapshot => {
        const printableItems: ReceiptItemSnapshot[] = data.map((item) => {
            const unitPrice = item.price_at_order ?? 0
            const quantity = item.quantity ?? 0

            return {
                dishName: resolveDishNameFromOrderItem(item),
                quantity,
                unitPrice,
                lineTotal: unitPrice * quantity,
            }
        })

        const grandTotal = printableItems.reduce((sum, item) => sum + item.lineTotal, 0)
        const statusLabel = getOrderStatusMeta(nextStatus).label

        return {
            printedAt: formatReceiptDate(new Date()),
            website: typeof window !== 'undefined' ? window.location.host : 'www.pos360.vn',
            tableLabel: orderTableLabel,
            orderNo: order.order_no ?? order.documentId ?? 'Không có mã',
            customerName: customerNameInput.trim() || 'Khách lẻ',
            statusLabel,
            items: printableItems,
            grandTotal,
            paidAmount: finalPaidAmount,
            changeAmount: finalChangeAmount,
            outstandingAmount: Math.max(grandTotal - finalPaidAmount, 0),
        }
    }

    const handlePrintAndCheckout = async ({
        forceOutstanding,
    }: {
        forceOutstanding?: boolean
    } = {}) => {
        if (!orderId) {
            toast.error('Không tìm thấy mã hóa đơn để chốt thanh toán.')
            return
        }

        if (!data.length) {
            toast.error('Hóa đơn chưa có món để in/chốt.')
            return
        }

        setIsProcessingCheckout(true)

        const orderTotal = data.reduce(
            (sum, item) => sum + (item.price_at_order ?? 0) * (item.quantity ?? 0),
            0,
        )

        const finalPaidAmount = forceOutstanding
            ? 0
            : Math.max(0, Math.floor(parseMoneyInput(paidAmountInput)))
        const finalOutstandingAmount = Math.max(orderTotal - finalPaidAmount, 0)
        const finalChangeAmount = Math.max(finalPaidAmount - orderTotal, 0)
        const nextStatus: OrderStatus =
            forceOutstanding || finalOutstandingAmount > 0
                ? 'outstanding'
                : 'paid'

        try {
            const trimmedCustomerName = customerNameInput.trim()
            const currentCustomerName = (order.customer_name ?? '').trim()

            if (trimmedCustomerName !== currentCustomerName) {
                await updateOrderCustomerName({
                    id: orderId,
                    customer_name: trimmedCustomerName,
                })
            }

            await updateOrderStatus({
                id: orderId,
                order_status: nextStatus,
                is_paid: nextStatus === 'paid',
                paid_time: new Date(),
                total_amount: orderTotal,
                paid_amount: finalPaidAmount,
                change_amount: finalChangeAmount,
            })

            const paymentDelta = Math.max(finalPaidAmount - latestPaidAmount, 0)
            if (paymentDelta > 0) {
                await createPayment({
                    order_id: orderId,
                    amount: paymentDelta,
                    method: 'cash',
                    status: nextStatus === 'paid' ? 'success' : 'pending',
                    paid_at: new Date(),
                    currency: 'VND',
                })
            }

            setLatestPaidAmount(finalPaidAmount)
            setLatestStatus(nextStatus)

            await refetchOrderDetails()
            setOpenCheckoutDrawer(false)

            const snapshot = buildReceiptSnapshot(
                nextStatus,
                finalPaidAmount,
                finalChangeAmount,
            )

            try {
                await openPrintWindowWithSnapshot(snapshot)

                if (nextStatus === 'paid') {
                    toast.success('Đã in và chốt thanh toán hóa đơn.')
                } else {
                    toast.success('Đã in hóa đơn và lưu trạng thái Còn thiếu.', {
                        description: `Khách còn thiếu ${formattedNumber(finalOutstandingAmount)}.`,
                    })
                }
            } catch (printError) {
                toast.success(
                    nextStatus === 'paid'
                        ? 'Đã chốt thanh toán hóa đơn'
                        : 'Đã lưu trạng thái Còn thiếu',
                    {
                        description:
                            printError instanceof Error
                                ? `${printError.message} Bạn có thể bấm In hóa đơn để in lại.`
                                : 'Không thể mở cửa sổ in. Bạn có thể in lại ở nút In hóa đơn.',
                    },
                )
            }
        } catch (error) {
            toast.error('Không thể in/chốt hóa đơn', {
                description: error instanceof Error ? error.message : 'Vui lòng thử lại.',
            })
        } finally {
            setIsProcessingCheckout(false)
        }
    }

    if (isInitialLoading) {
        return (
            <div className='space-y-3 rounded-xl border border-[#ead8c4] bg-white p-4'>
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-full' />
            </div>
        )
    }

    if (isOrderDetailsError) {
        return (
            <div className='rounded-xl border border-[#efc8c8] bg-[#fff7f7] p-4'>
                <p className='text-sm font-semibold text-[#a03232]'>
                    Không thể tải chi tiết hóa đơn.
                </p>
                <Button
                    type='button'
                    variant='outline'
                    onClick={() => refetchOrderDetails()}
                    className='mt-3 border-[#e4b9b9] bg-white text-[#8f3434] hover:bg-[#fff0f0] hover:text-[#8f3434]'
                >
                    Tải lại
                </Button>
            </div>
        )
    }

    return (
        <div className='space-y-4'>
            <div className='relative overflow-hidden rounded-xl border border-[#ead8c4] bg-white'>
                {isBackgroundFetching ? (
                    <div className='absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-[#e4d2bc] bg-white px-2.5 py-1 text-xs font-semibold text-[#6f4b2a]'>
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                        Đang cập nhật...
                    </div>
                ) : null}

                <Table>
                    <TableHeader className='bg-[#fff8ef]'>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className='border-[#efdec9] hover:bg-transparent'>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className='px-3 py-3 text-center font-semibold text-[#5d4024]'>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className='border-[#f2e7d8] text-center hover:bg-[#fffaf2]'
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className='px-3 py-3 text-[#3f2b16]'>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className='h-20 text-center text-[#8d6b4a]'>
                                    Không có món trong hóa đơn.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='rounded-lg border border-[#ead8c4] bg-[#fffaf3] px-4 py-2 text-sm font-semibold text-[#6a4a2d]'>
                    Tổng tiền: <span className='text-secondary'>{formattedNumber(totalAmount)}</span>
                </div>
                <Button
                    type='button'
                    className='bg-secondary text-white hover:bg-secondary/90 hover:text-white'
                    onClick={handleOpenAddDrawer}
                >
                    Chỉnh sửa
                </Button>
            </div>

            <Drawer
                open={openAddDrawer}
                onOpenChange={(open) => {
                    setOpenAddDrawer(open)
                    if (!open) resetAddDrawerState()
                }}
                direction='bottom'
            >
                <DrawerContent className='w-full'>
                    <DrawerHeader className='border-b border-[#ebdbc7] bg-[#fffaf4]'>
                        <DrawerTitle className='text-2xl font-bold text-[#3f2b16]'>
                            Thêm món vào hóa đơn {order.order_no ?? order.documentId}
                        </DrawerTitle>
                        <DrawerDescription className='text-[#7a5b3a]'>
                            Chỉ cho phép thêm món mới. Món đã có trong hóa đơn sẽ được cộng thêm số lượng.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className='max-h-[72vh] overflow-y-auto p-5'>
                        <div className='mb-4 rounded-2xl border border-[#ead8c4] bg-white p-4'>
                            <div className='grid gap-2 text-sm text-[#4a2f18] md:grid-cols-3'>
                                <p>
                                    <span className='font-semibold'>Bàn:</span> {orderTableLabel}
                                </p>
                                <p>
                                    <span className='font-semibold'>Mã đơn:</span>{' '}
                                    {order.order_no ?? order.documentId}
                                </p>
                                <p>
                                    <span className='font-semibold'>Trạng thái:</span>{' '}
                                    {getOrderStatusMeta(latestStatus).label}
                                </p>
                            </div>
                        </div>

                        <div className='mb-5 rounded-2xl border border-[#ead8c4] bg-white p-4'>
                            <div className='flex flex-wrap items-center justify-between gap-2'>
                                <h4 className='text-base font-bold text-[#4a2f18]'>Món sẽ thêm vào hóa đơn</h4>
                                <span className='rounded-full border border-[#ead8c4] bg-[#fff9f2] px-3 py-1 text-xs font-semibold text-[#6a4a2d]'>
                                    {pendingSelectionsCount} món • {formattedNumber(pendingSelectionsTotal)}
                                </span>
                            </div>

                            {pendingSelectionsList.length ? (
                                <div className='mt-3 space-y-2'>
                                    {pendingSelectionsList.map((selection) => (
                                        <div
                                            key={selection.dishId}
                                            className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#efdfcd] bg-[#fffdf9] px-3 py-2'
                                        >
                                            <div>
                                                <p className='font-semibold text-[#3f2b16]'>
                                                    {selection.dish.name}
                                                </p>
                                                <p className='text-xs text-[#8d6b4a]'>
                                                    {formattedNumber(selection.unitPrice)} / phần
                                                </p>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <Button
                                                    type='button'
                                                    className='h-8 w-8 rounded-full bg-secondary p-0 text-white hover:bg-secondary/90 hover:text-white'
                                                    onClick={() =>
                                                        updatePendingSelection(
                                                            selection.dishId,
                                                            selection.quantity - 1,
                                                        )
                                                    }
                                                >
                                                    <Minus className='h-3.5 w-3.5 stroke-[3]' />
                                                </Button>
                                                <span className='min-w-6 text-center text-sm font-semibold text-[#4a2f18]'>
                                                    {selection.quantity}
                                                </span>
                                                <Button
                                                    type='button'
                                                    className='h-8 w-8 rounded-full bg-secondary p-0 text-white hover:bg-secondary/90 hover:text-white'
                                                    onClick={() =>
                                                        updatePendingSelection(
                                                            selection.dishId,
                                                            selection.quantity + 1,
                                                        )
                                                    }
                                                >
                                                    <Plus className='h-3.5 w-3.5 stroke-[3]' />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className='mt-2 text-sm text-[#8d6b4a]'>
                                    Chọn món bên dưới để thêm vào hóa đơn.
                                </p>
                            )}
                        </div>

                        {selectedCategory ? (
                            <div className='space-y-4'>
                                <div className='flex flex-wrap items-center gap-2'>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        className='border-[#e4d1ba] bg-white text-[#6f4b2a] hover:bg-[#fff5e9] hover:text-[#5d3e24]'
                                        onClick={() => setSelectedCategory('')}
                                    >
                                        <ArrowLeft className='mr-2 h-4 w-4' />
                                        Quay lại danh mục
                                    </Button>
                                    {isDishesFetching ? (
                                        <span className='inline-flex items-center gap-1 rounded-full border border-[#e4d2bc] bg-white px-2.5 py-1 text-xs font-semibold text-[#6f4b2a]'>
                                            <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                            Đang cập nhật món...
                                        </span>
                                    ) : null}
                                </div>

                                {(isDishesInitialLoading && !dishesResponse) ? (
                                    <div className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4'>
                                        {Array.from({ length: 8 }).map((_, index) => (
                                            <Card key={index} className='w-full overflow-hidden rounded-2xl border border-[#eadfce] bg-white py-0 shadow-sm'>
                                                <CardContent className='p-3'>
                                                    <Skeleton className='aspect-square w-full rounded-xl' />
                                                </CardContent>
                                                <CardHeader className='px-3 pt-0 pb-2'>
                                                    <Skeleton className='h-6 w-28' />
                                                    <Skeleton className='mt-2 h-4 w-20' />
                                                </CardHeader>
                                            </Card>
                                        ))}
                                    </div>
                                ) : null}

                                {isDishesError ? (
                                    <div className='rounded-xl border border-[#f0d9be] bg-[#fffaf3] p-4'>
                                        <p className='text-sm font-medium text-[#8f5a2b]'>
                                            Không tải được danh sách món ăn.
                                        </p>
                                        <Button
                                            type='button'
                                            onClick={() => refetchDishes()}
                                            className='mt-3 bg-secondary text-white hover:bg-secondary/90 hover:text-white'
                                        >
                                            <RefreshCcw className='mr-2 h-4 w-4' />
                                            Tải lại món ăn
                                        </Button>
                                    </div>
                                ) : null}

                                {!isDishesError && !(isDishesInitialLoading && !dishesResponse) ? (
                                    dishes.length ? (
                                        <div className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
                                            {dishes.map((dish) => (
                                                <Card
                                                    key={dish.documentId ?? dish.id}
                                                    className='group w-full cursor-pointer overflow-hidden rounded-2xl border border-[#eadfce] bg-white py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md'
                                                    onClick={() => addDishToPendingSelection(dish)}
                                                >
                                                    <CardContent className='p-3'>
                                                        <Image
                                                            src={resolveDishImageUrl(dish)}
                                                            width={320}
                                                            height={320}
                                                            alt={dish.name}
                                                            className='aspect-square w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.02]'
                                                        />
                                                    </CardContent>
                                                    <CardHeader className='px-3 pt-0 pb-2'>
                                                        <CardTitle className='line-clamp-1 text-base text-[#3f2b16]'>
                                                            {dish.name}
                                                        </CardTitle>
                                                        <p className='line-clamp-1 text-xs text-[#8b6a49]'>
                                                            {dish.category?.name ?? 'Món ăn'}
                                                        </p>
                                                    </CardHeader>
                                                    <CardFooter className='px-3 pb-4 pt-0'>
                                                        <p className='text-lg font-bold text-secondary'>
                                                            {formattedNumber(resolveDishUnitPrice(dish))}
                                                        </p>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className='relative overflow-hidden rounded-3xl border border-[#e8dccc] bg-gradient-to-br from-[#fffaf3] via-[#fff3e4] to-[#fffdf8] p-6'>
                                            <div className='pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#ffd8af]/45 blur-2xl' />
                                            <div className='pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-[#f3c78e]/35 blur-2xl' />

                                            <div className='relative z-10 flex flex-col items-center gap-5 lg:flex-row'>
                                                <div className='relative h-32 w-32 overflow-hidden rounded-2xl border border-[#efd9bf] bg-white/80 shadow-sm'>
                                                    <Image
                                                        src='/category-food-placeholder.svg'
                                                        alt='Danh mục trống'
                                                        fill
                                                        sizes='128px'
                                                        className='object-cover'
                                                    />
                                                </div>

                                                <div className='text-center lg:text-left'>
                                                    <div className='inline-flex items-center gap-2 rounded-full border border-[#f0d9be] bg-white/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a06b38]'>
                                                        <UtensilsCrossed className='h-3.5 w-3.5' />
                                                        Danh mục trống
                                                    </div>
                                                    <h3 className='mt-3 text-2xl font-bold text-[#4a2f18]'>
                                                        Danh mục này chưa có món ăn
                                                    </h3>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ) : null}
                            </div>
                        ) : (
                            <div>
                                {isCategoriesInitialLoading && !categoriesResponse ? (
                                    <div className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
                                        {Array.from({ length: 10 }).map((_, index) => (
                                            <Card key={index} className='pb-0 pt-3'>
                                                <CardHeader className='py-0 text-center'>
                                                    <Skeleton className='mx-auto h-4 w-20' />
                                                </CardHeader>
                                                <CardContent className='p-0'>
                                                    <Skeleton className='h-[140px] w-full rounded-bl-xl rounded-br-xl' />
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : null}

                                {isCategoriesError ? (
                                    <div className='rounded-xl border border-[#f0d9be] bg-[#fffaf3] p-4'>
                                        <p className='text-sm font-medium text-[#8f5a2b]'>
                                            Không tải được danh mục món.
                                        </p>
                                        <Button
                                            type='button'
                                            onClick={() => refetchCategories()}
                                            className='mt-3 bg-secondary text-white hover:bg-secondary/90 hover:text-white'
                                        >
                                            <RefreshCcw className='mr-2 h-4 w-4' />
                                            Tải lại danh mục
                                        </Button>
                                    </div>
                                ) : null}

                                {!isCategoriesError && !(isCategoriesInitialLoading && !categoriesResponse) ? (
                                    <>
                                        {isCategoriesFetching ? (
                                            <div className='mb-3 inline-flex items-center gap-1 rounded-full border border-[#e4d2bc] bg-white px-2.5 py-1 text-xs font-semibold text-[#6f4b2a]'>
                                                <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                                Đang cập nhật danh mục...
                                            </div>
                                        ) : null}

                                        <div className='grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
                                            {categories.map((item) => (
                                                <Card
                                                    key={item.documentId ?? item.id}
                                                    onClick={() => setSelectedCategory(item.name)}
                                                    className='cursor-pointer gap-2 pb-0 pt-3 transition-transform duration-300 hover:scale-105 hover:shadow-lg'
                                                >
                                                    <CardHeader className='py-0 text-center text-sm font-semibold uppercase'>
                                                        {item.name}
                                                    </CardHeader>
                                                    <CardContent className='p-0'>
                                                        <Image
                                                            src={
                                                                item?.image?.url
                                                                    ? item.image.url.startsWith('http')
                                                                        ? item.image.url
                                                                        : `${STRAPI_BASE_URL}${item.image.url}`
                                                                    : '/category-food-placeholder.svg'
                                                            }
                                                            width={200}
                                                            height={200}
                                                            alt={item.name}
                                                            className='h-[150px] w-full rounded-bl-xl rounded-br-xl object-cover'
                                                        />
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        )}
                    </div>

                    <DrawerFooter className='border-t border-[#ebdbc7] bg-white'>
                        <div className='flex flex-wrap justify-end gap-3'>
                            <Button
                                type='button'
                                variant='outline'
                                className='h-11 min-w-[140px] border-[#e0c9ad] bg-white text-[#6f4b2a] hover:bg-[#fff7ed] hover:text-[#6f4b2a]'
                                onClick={() => {
                                    setOpenAddDrawer(false)
                                    resetAddDrawerState()
                                }}
                                disabled={isSavingAddedItems}
                            >
                                Đóng
                            </Button>
                            <Button
                                type='button'
                                className='h-11 min-w-[220px] bg-secondary text-white hover:bg-secondary/90 hover:text-white'
                                onClick={handleSaveAddedItems}
                                disabled={isSavingAddedItems || !pendingSelectionsList.length}
                            >
                                {isSavingAddedItems ? 'Đang lưu món...' : 'Lưu món & mở in hóa đơn'}
                            </Button>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            <Drawer
                open={openCheckoutDrawer}
                onOpenChange={setOpenCheckoutDrawer}
                direction='right'
            >
                <DrawerContent className='w-full sm:max-w-3xl'>
                    <DrawerHeader className='border-b border-[#ebdbc7] bg-[#fffaf4]'>
                        <DrawerTitle className='text-2xl font-bold text-[#3f2b16]'>
                            Xác nhận thanh toán lại hóa đơn {order.order_no ?? order.documentId}
                        </DrawerTitle>
                        <DrawerDescription className='text-[#7a5b3a]'>
                            Kiểm tra thông tin sau khi thêm món và in/chốt lại hóa đơn.
                        </DrawerDescription>
                    </DrawerHeader>

                    <div className='flex-1 overflow-y-auto p-5'>
                        <div className='rounded-2xl border border-[#ead8c4] bg-white p-4'>
                            <div className='grid gap-2 text-sm text-[#4a2f18] md:grid-cols-3'>
                                <p>
                                    <span className='font-semibold'>Bàn:</span>{' '}
                                    {orderTableLabel}
                                </p>
                                <p>
                                    <span className='font-semibold'>Mã đơn:</span>{' '}
                                    {order.order_no ?? order.documentId}
                                </p>
                                <p>
                                    <span className='font-semibold'>Số món:</span>{' '}
                                    {data.length}
                                </p>
                            </div>

                            <div className='mt-4 rounded-xl border border-[#f0dfcb] bg-[#fffaf5] p-3'>
                                <label
                                    htmlFor={`customer-name-${orderId}`}
                                    className='text-sm font-semibold text-[#5a3b1f]'
                                >
                                    Tên khách hàng
                                </label>
                                <div className='mt-2 flex flex-col gap-2 sm:flex-row'>
                                    <input
                                        id={`customer-name-${orderId}`}
                                        type='text'
                                        value={customerNameInput}
                                        onChange={(event) =>
                                            setCustomerNameInput(event.target.value)
                                        }
                                        placeholder='Nhập tên khách (không bắt buộc)'
                                        className='h-10 flex-1 rounded-lg border border-[#e2ccb2] bg-white px-3 text-sm text-[#3f2b16] outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                                    />
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={handleSaveCustomerName}
                                        disabled={isSavingCustomerName}
                                        className='h-10 border-[#e2ccb2] bg-white text-[#6f4b2a] hover:bg-[#fff2e2] hover:text-[#6f4b2a]'
                                    >
                                        {isSavingCustomerName ? 'Đang lưu...' : 'Lưu tên'}
                                    </Button>
                                </div>
                            </div>

                            <div className='mt-4 overflow-hidden rounded-xl border border-[#f0dfcb]'>
                                <table className='w-full text-sm'>
                                    <thead className='bg-[#fff2e2] text-[#5a3b1f]'>
                                        <tr>
                                            <th className='px-3 py-2 text-left font-semibold'>
                                                Món
                                            </th>
                                            <th className='px-3 py-2 text-center font-semibold'>
                                                SL
                                            </th>
                                            <th className='px-3 py-2 text-right font-semibold'>
                                                Đơn giá
                                            </th>
                                            <th className='px-3 py-2 text-right font-semibold'>
                                                Thành tiền
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((item, index) => (
                                            <tr
                                                key={`${resolveOrderItemDocumentId(item)}-${index}`}
                                                className='border-t border-[#f6e8d8]'
                                            >
                                                <td className='px-3 py-2 text-[#3f2b16]'>
                                                    {resolveDishNameFromOrderItem(item)}
                                                </td>
                                                <td className='px-3 py-2 text-center text-[#5d3e24]'>
                                                    {item.quantity}
                                                </td>
                                                <td className='px-3 py-2 text-right text-[#5d3e24]'>
                                                    {formattedNumber(item.price_at_order)}
                                                </td>
                                                <td className='px-3 py-2 text-right font-semibold text-secondary'>
                                                    {formattedNumber(
                                                        (item.price_at_order ?? 0) * (item.quantity ?? 0),
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className='mt-4 space-y-3'>
                                <div className='rounded-xl border border-[#f0dfcb] bg-[#fffbf6] px-4 py-3'>
                                    <span className='text-sm font-semibold uppercase tracking-[0.14em] text-[#8b6a49]'>
                                        Tổng thanh toán
                                    </span>
                                    <span className='mt-2 block text-2xl font-bold text-secondary'>
                                        {formattedNumber(totalAmount)}
                                    </span>
                                </div>

                                <div className='rounded-xl border border-[#f0dfcb] bg-[#fffaf5] px-4 py-3'>
                                    <label
                                        htmlFor={`paid-amount-${orderId}`}
                                        className='text-sm font-semibold text-[#5a3b1f]'
                                    >
                                        Tiền khách đưa
                                    </label>
                                    <div className='mt-2 flex items-center gap-2'>
                                        <input
                                            id={`paid-amount-${orderId}`}
                                            type='text'
                                            inputMode='numeric'
                                            pattern='[0-9]*'
                                            value={paidAmountInput}
                                            onChange={(event) =>
                                                setPaidAmountInput(
                                                    getDigitsOnly(event.target.value),
                                                )
                                            }
                                            className='h-10 w-full rounded-lg border border-[#e2ccb2] bg-white px-3 text-sm text-[#3f2b16] outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                                            placeholder='Nhập số tiền khách đã trả'
                                        />
                                        <span className='text-sm font-semibold text-[#7a5b3a]'>
                                            VND
                                        </span>
                                    </div>
                                    <p className='mt-1 text-xs text-[#9a7c5e]'>
                                        {formattedNumber(paidAmountValue)}
                                    </p>
                                </div>
                            </div>

                            <div className='mt-3 rounded-xl border border-[#f0dfcb] bg-[#fffbf6] px-4 py-3'>
                                <div className='flex items-center justify-between'>
                                    <span className='text-sm font-semibold text-[#5a3b1f]'>
                                        {willMarkOutstanding ? 'Còn thiếu' : 'Tiền thối lại'}
                                    </span>
                                    <span
                                        className={`text-lg font-bold ${
                                            willMarkOutstanding
                                                ? 'text-rose-600'
                                                : 'text-emerald-600'
                                        }`}
                                    >
                                        {formattedNumber(
                                            willMarkOutstanding
                                                ? outstandingAmount
                                                : changeAmount,
                                        )}
                                    </span>
                                </div>
                                <p className='mt-1 text-xs text-[#8f7154]'>
                                    {willMarkOutstanding
                                        ? 'Đơn sẽ được lưu trạng thái Còn thiếu.'
                                        : 'Đơn sẽ được lưu trạng thái Đã thanh toán.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <DrawerFooter className='border-t border-[#ebdbc7] bg-white'>
                        <div className='flex flex-wrap justify-end gap-3'>
                            <Button
                                type='button'
                                variant='outline'
                                className='h-11 min-w-[140px] border-[#e0c9ad] bg-white text-[#6f4b2a] hover:bg-[#fff7ed] hover:text-[#6f4b2a]'
                                onClick={() => setOpenCheckoutDrawer(false)}
                                disabled={isProcessingCheckout}
                            >
                                Đóng
                            </Button>
                            <Button
                                type='button'
                                className='h-11 min-w-[210px] bg-primary text-primary-foreground hover:opacity-95'
                                onClick={() =>
                                    handlePrintAndCheckout({ forceOutstanding: true })
                                }
                                disabled={isProcessingCheckout}
                            >
                                <Printer className='mr-2 h-4 w-4 text-secondary' />
                                {isProcessingCheckout
                                    ? 'Đang xử lý...'
                                    : 'In hóa đơn & còn thiếu'}
                            </Button>
                            <Button
                                type='button'
                                className='h-11 min-w-[220px] bg-secondary text-white hover:bg-secondary/90 hover:text-white'
                                onClick={() => handlePrintAndCheckout()}
                                disabled={isProcessingCheckout}
                            >
                                <Printer className='mr-2 h-4 w-4' />
                                {isProcessingCheckout
                                    ? 'Đang xử lý...'
                                    : willMarkOutstanding
                                        ? 'In hóa đơn & lưu còn thiếu'
                                        : 'In hóa đơn & thanh toán'}
                            </Button>
                        </div>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        </div>
    )
}

export default OrderDetails
