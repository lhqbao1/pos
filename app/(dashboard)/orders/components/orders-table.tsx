'use client'
import React, { useEffect } from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { Order } from '@/features/order/type'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useGetOrders } from '@/features/order/hook'
import { formattedNumber } from '@/lib/format-vnd'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import OrderDetails from './order-details'
import { useAtom } from 'jotai'
import { endDateFilterAtom, startDateFilterAtom, statusFilterAtom } from '@/lib/atom/orders/orders'

const OrdersTable = () => {
    // Get the filter values from the Jotai atoms
    const [statusFilter] = useAtom(statusFilterAtom)
    const [startDateFilter] = useAtom(startDateFilterAtom)
    const [endDateFilter] = useAtom(endDateFilterAtom)

    // Fetch the list of orders using the filters
    const { data: listOrders, isLoading: listOrdersLoading, isError: listOrdersError } = useGetOrders({ order_status: statusFilter, start_date: startDateFilter, end_date: endDateFilter })

    // State to manage the expanded row
    const [expandedRowId, setExpandedRowId] = React.useState<string | null>(null);

    // Create table columns
    const columns: ColumnDef<Order>[] = [
        {
            accessorKey: "documentId",
            header: "Mã hóa đơn",
        },
        {
            accessorKey: "table",
            header: "Số bàn",
            cell: ({ row }) => {
                const table = row.original.table_id;
                return table ? `Bàn ${table.tableNumber}` : "Chưa có bàn";
            }
        },
        {
            accessorKey: "paid_time",
            header: "Ngày bán",
            cell: ({ row }) => {
                const paidTime = row.original.paid_time;
                return paidTime ? new Date(paidTime).toLocaleString() : "Chưa thanh toán";
            }
        },
        {
            accessorKey: "total_amount",
            header: "Tổng tiền",
            cell: ({ row }) => {
                const totalAmount = row.original.total_amount;
                return totalAmount ? <div className='font-semibold'>{formattedNumber(totalAmount)}</div> : "Chưa có";
            }
        },
        {
            accessorKey: "order_status",
            header: "Trạng thái",
            cell: ({ row }) => {
                const status = row.original.order_status;
                return (
                    <span className={`px-2.5 py-2 rounded-md text-xs font-semibold ${status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                );
            }
        },
        {
            accessorKey: "action",
            header: "Hành động",
            cell: ({ row }) => {
                const orderId = row.original.documentId;
                return (
                    <Dialog>
                        <DialogTrigger>Open</DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Are you absolutely sure?</DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This will permanently delete your account
                                    and remove your data from our servers.
                                </DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                );
            }
        }
    ]

    // Initialize the React Table with the data and columns
    const table = useReactTable({
        data: listOrders?.data ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    if (listOrdersLoading) return <div className='col-span-7 bg-white rounded-lg h-full'>Loading...</div>
    if (listOrdersError) return <div className='col-span-7 bg-white rounded-lg h-full'>Error...</div>

    return (
        <div className='mt-6 bg-white rounded-lg h-full'>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className='text-left px-6'>
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
                        {table.getRowModel()?.rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <React.Fragment key={row.id}>
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        onClick={() =>
                                            setExpandedRowId(expandedRowId === row.id ? null : row.id)
                                        }
                                        className='hover:bg-gray-100 cursor-pointer'
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className='py-5 text-left px-6'>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {expandedRowId === row.id && (
                                        <TableRow
                                            className={`transform transition-all duration-300 ease-in-out origin-top ${expandedRowId === row.id
                                                ? 'scale-y-100 opacity-100'
                                                : 'scale-y-0 opacity-0'
                                                }`}
                                        >
                                            <TableCell colSpan={columns.length} className="bg-gray-50 px-6 py-4">
                                                <OrderDetails orderId={row.original.documentId ?? ""} order_status={row.original.order_status ?? ""} orderTable={row.original.table_id?.tableNumber ?? ""} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

export default OrdersTable