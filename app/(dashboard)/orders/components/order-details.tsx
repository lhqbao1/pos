'use client'
import { useGetOrderItemsByOrderId } from '@/features/order-items/hook'
import React from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { OrderItem } from '@/features/order-items/type'
import { formattedNumber } from '@/lib/format-vnd'
import { Button } from '@/components/ui/button'
import { toast } from "sonner"
import { useAtom } from 'jotai'
import { tableNumberAtom } from '@/lib/atom/table/tables'
import { useRouter } from 'next/navigation'


export const columns: ColumnDef<OrderItem>[] = [
    {
        accessorKey: "index",
        header: "Số thứ tự",
        cell: ({ row }) => {
            return row.index + 1
        }
    },
    {
        accessorKey: "name",
        header: "Tên sản phẩm",
        cell: ({ row }) => {
            return row.original.dish_id?.name
        }
    },
    {
        accessorKey: "quantity",
        header: "Số lượng",
    },
    {
        accessorKey: "price_at_order",
        header: "Đơn giá",
        cell: ({ row }) => {
            const priceAtOrder = row.original.price_at_order || 0
            return formattedNumber(priceAtOrder)
        }
    },
    {
        accessorKey: "total_price",
        header: "Thành tiền",
        cell: ({ row }) => {
            const quantity = row.original.quantity || 0
            const priceAtOrder = row.original.price_at_order || 0
            return formattedNumber(quantity * priceAtOrder)
        }
    },
]

const OrderDetails = ({ orderId, order_status, orderTable }: { orderId: string, order_status: string, orderTable: string }) => {
    const { data: orderDetails, isLoading: orderDetailsLoading, isError: orderDetailsError } = useGetOrderItemsByOrderId(orderId)
    const [currentTable, setCurrentTable] = useAtom(tableNumberAtom)
    const router = useRouter()

    const table = useReactTable({
        data: orderDetails?.data ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    if (orderDetailsLoading) return <div>Loading...</div>
    if (orderDetailsError) return <div>Error loading order details</div>

    const editOrder = () => {
        if (order_status === "paid") {
            toast.error("Hóa đơn đã thanh toán không được chỉnh sửa", {
                position: "top-right",
                duration: 1000,
                className: "!bg-red-200 !text-red-600",
                closeButton: true,
            })
        }
        else {
            setCurrentTable(orderTable)
            // Navigate to edit order page
            router.push('/cashier')
        }
    }

    return (
        <div className="">
            <div className='border-1 rounded-md mb-4'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className='text-center'>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <React.Fragment key={row.id}>
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className='text-center'
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                        <TableRow>
                            <TableCell>
                                Tổng tiền
                            </TableCell>
                            <TableCell className='font-bold'>
                                {orderDetails?.data?.length ? formattedNumber(orderDetails.data.reduce((total, item) => {
                                    const priceAtOrder = item.price_at_order || 0
                                    return total + (item.quantity || 0) * priceAtOrder
                                }
                                    , 0)) : formattedNumber(0)}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            <Button className='bg-secondary hover:opacity-85 hover:bg-secondary cursor-pointer' onClick={() => editOrder()}>Chỉnh sửa</Button>
        </div>
    )
}


export default OrderDetails