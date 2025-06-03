'use client'
import { useDeleteOrderItem, useGetOrderItemsWithTable, useUpdateOrderItemQuantity } from '@/features/order-items/hook'
import { OrderItem } from '@/features/order-items/type'
import { tableIdAtom, tableNumberAtom } from '@/lib/atom/table/tables'
import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
import { Minus, Plus } from 'lucide-react'
import { formattedNumber } from '@/lib/format-vnd'
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
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useGetOrderByTable, useUpdateOrderStatus } from '@/features/order/hook'
import { useUpdateTableStatus } from '@/features/tables/hook'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const ListMealsTable = () => {
    const [openDialog, setOpenDialog] = useState(false);
    const [currentTable] = useAtom(tableNumberAtom)
    const [currentTableId] = useAtom(tableIdAtom)
    const [totalAmount, setTotalAmount] = useState(0);
    const { data: listOrderItems, isLoading, isError } = useGetOrderItemsWithTable(currentTable)
    const { data: currentOrder, isLoading: isOrderLoading, isError: isOrderError } = useGetOrderByTable(currentTableId)
    const [orderItems, setOrderItems] = useState<OrderItem[]>(listOrderItems);

    const { mutate: updateOrderItemQuantity } = useUpdateOrderItemQuantity()
    const { mutate: deleteOrderItem } = useDeleteOrderItem()
    const { mutate: updateOrderStatus } = useUpdateOrderStatus()
    const { mutate: updateTableStatus } = useUpdateTableStatus()

    useEffect(() => {
        console.log(currentTable)
        if (listOrderItems && listOrderItems.data.length > 0) {
            setOrderItems(listOrderItems.data);
            setTotalAmount(listOrderItems.data.reduce((total, item) => total + (item.price_at_order * item.quantity), 0));
        }
    }, [listOrderItems, currentTable]);

    //Create column
    const columns: ColumnDef<OrderItem>[] = [
        {
            accessorKey: "status",
            header: "STT",
            cell: ({ row }) => {
                let i = 1;
                return (
                    <div>{i++}</div>
                )
            }
        },
        {
            accessorFn: (row) => row.dish_id?.name,  // Use optional chaining just in case
            header: "Tên hàng hóa",
        },
        {
            accessorKey: "quantity",
            header: "Số lượng",
            cell: ({ row }) => {
                // This is the current row's quantity
                const quantity = row.original.quantity;

                // Define the handlers for increasing and decreasing quantity
                const handleIncrease = () => {
                    updateOrderItemQuantity({
                        id: row.original.documentId ?? '',
                        quantity: quantity + 1
                    });
                };

                // Define the handler for decreasing quantity
                const handleDecrease = () => {
                    if (quantity === 1) {
                        deleteOrderItem(row.original.documentId ?? '');
                    } else {
                        // Implement your logic to decrease quantity
                        updateOrderItemQuantity({
                            id: row.original.documentId ?? '',
                            quantity: quantity - 1
                        });
                    }
                };

                return (
                    <div className="flex justify-center items-center gap-2">
                        <Button className='rounded-full bg-secondary p-0 w-[24px] h-[24px]' onClick={handleDecrease}>
                            <Minus className="!w-2.5 !h-2.5 font-bold text-white stroke-3" />
                        </Button>
                        <span className='w-8'>{quantity}</span>
                        <Button className='rounded-full bg-secondary p-0 w-[24px] h-[24px]' onClick={() => handleIncrease()}>
                            <Plus size={12} className="!w-3 !h-3 font-bold text-white stroke-3" />
                        </Button>
                    </div>
                );
            },
        },
        {
            accessorKey: 'price_at_order',
            header: "Đơn giá",
            cell: ({ row }) => {
                return (
                    <div>{formattedNumber(row.original.price_at_order)}</div>
                )
            }
        },
        {
            accessorKey: 'total_amount',
            header: 'Thành tiền',
            cell: ({ row }) => {
                //Get price at order and quantity
                const { price_at_order, quantity } = row.original

                //Calculate total amount by minus two of them
                const totalAmount = price_at_order * quantity

                const formattedAmount = formattedNumber(totalAmount)

                return (
                    <div>{formattedAmount}</div>
                )
            }

        }
    ]

    //Assign data and columns to table
    const table = useReactTable({
        // data: currentOrder?.data[0].order_status === "paid" ? [] : orderItems,
        data: listOrderItems?.data ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const handleCalculateBill = () => {
        // Update order status
        updateOrderStatus({
            id: currentOrder.data[0].documentId ?? '',
            order_status: 'paid',
            is_paid: true,
            paid_time: new Date(),
            total_amount: orderItems.reduce((total, item) => total + (item.price_at_order * item.quantity), 0)
        });

        //Update table status
        updateTableStatus({
            table_id: currentTableId,
            table_status: 'Empty'
        });
    }


    if (isLoading) {
        return (
            <div className='h-full bg-white rounded-xl flex flex-col px-5 gap-3 py-4'>
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
        )
    }
    if (isError) return <div>...Error</div>
    if (!listOrderItems || !listOrderItems.data || listOrderItems.data.length === 0 || currentOrder?.data[0].order_status === "paid") {
        return <div className='w-full h-full bg-white rounded-xl flex flex-col justify-center items-center gap-9'>
            <Image
                src="/empty.png"
                alt="No data"
                width={300}
                height={300}
            />
            <h2 className='text-amber-400 font-bold text-xl uppercase'>Chưa có món ăn nào được gọi!</h2>
        </div>
    }

    return (
        <Card className='h-full py-0 px-0'>
            <CardContent className='px-0'>
                <div className="rounded-md">
                    <Table>
                        <TableHeader className='bg-orange-200 rounded-t-xl'>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header, index) => {
                                        const isFirst = index === 0;
                                        const isLast = index === headerGroup.headers.length - 1;
                                        return (
                                            <TableHead
                                                key={header.id}
                                                className={`
                                                    ${isFirst ? 'rounded-tl-xl' : ''}
                                                    ${isLast ? 'rounded-tr-xl' : ''}
                                                    text-center
                                                `}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
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
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className='text-center'>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
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
            </CardContent>
            <CardFooter className='flex-col gap-4 items-start rounded-b-xl text-center mt-auto border-t-1 border-gray-300 border-dashed py-6'>
                <div className='flex flex-row justify-between w-full'>
                    <p>Tổng cộng:</p>
                    <p className='text-xl font-semibold text-secondary'>{formattedNumber(totalAmount)}</p>
                </div>
                <div className='flex flex-row gap-4'>
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <Button onClick={() => setOpenDialog(!openDialog)} className='bg-secondary text-md font-semibold px-8 py-6 hover:bg-secondary cursor-pointer hover:opacity-85'>Tính tiền</Button>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tính tiền bàn {currentTable}</DialogTitle>
                                <DialogDescription>
                                    Bạn có chắc chắn muốn tính tiền bàn {currentTable} không?
                                    <br />
                                    Sau khi xác nhận, bạn sẽ không thể chỉnh sửa đơn hàng này nữa.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={handleCalculateBill} className='text-white cursor-pointer'>
                                    Xác nhận
                                </Button>
                                <Button type="button" variant="default" className='text-black cursor-pointer' onClick={() => setOpenDialog(false)}>
                                    Hủy
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Button className='bg-orange-200 text-black text-md font-semibold px-8 py-6 cursor-pointer hover:opacity-85 hover:bg-orange-200'>Tạm tính</Button>
                </div>
            </CardFooter>
        </Card>
    )
}

export default ListMealsTable