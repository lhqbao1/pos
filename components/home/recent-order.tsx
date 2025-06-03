'use client'
import React from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    ColumnDef,
    ColumnFiltersState,
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table'
import { Checkbox } from '../ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { Button } from '../ui/button'
import { MoreHorizontal } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'
import Image from 'next/image'
import SearchForm from '../../app/(dashboard)/menu/components/list-meals/search-form'
import SelectPeriod from './select-period'

//Type of dummy data
interface Order {
    id: string,
    image: string,
    name: string,
    category: string,
    quantity: number,
    price: number,
    table: number,
    status: string
}

//Dummy data
const dummyData: Order[] = [
    {
        id: "1",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuzIWaalSykI3e8r0DfhJTM6yLzEMdg5hGRQ&s",
        name: "Giò heo nướng",
        category: "Heo",
        quantity: 1,
        price: 170000,
        table: 2,
        status: "On Process"

    },
    {
        id: "2",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuzIWaalSykI3e8r0DfhJTM6yLzEMdg5hGRQ&s",
        name: "Cá đuối chiên sả",
        category: "Cá",
        quantity: 3,
        price: 150000,
        table: 2,
        status: "On Process"

    },
    {
        id: "3",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuzIWaalSykI3e8r0DfhJTM6yLzEMdg5hGRQ&s",
        name: "Mực chiên bột",
        category: "Hải sản",
        quantity: 1,
        price: 100000,
        table: 3,
        status: "Done"

    },
    {
        id: "4",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuzIWaalSykI3e8r0DfhJTM6yLzEMdg5hGRQ&s",
        name: "Lẩu cù lao",
        category: "Lẩu",
        quantity: 2,
        price: 250000,
        table: 4,
        status: "Done"

    },
    {
        id: "5",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuzIWaalSykI3e8r0DfhJTM6yLzEMdg5hGRQ&s",
        name: "Bắp bò xào",
        category: "Bò",
        quantity: 3,
        price: 170000,
        table: 6,
        status: "On Process"

    },
    {
        id: "6",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuzIWaalSykI3e8r0DfhJTM6yLzEMdg5hGRQ&s",
        name: "Mì xào hải sản",
        category: "Khai vị",
        quantity: 2,
        price: 90000,
        table: 2,
        status: "On Process"

    },
    {
        id: "7",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuzIWaalSykI3e8r0DfhJTM6yLzEMdg5hGRQ&s",
        name: "Dê xào lăn",
        category: "Dê",
        quantity: 1,
        price: 200000,
        table: 2,
        status: "On Process"

    }
]

//Create columns
export const columns: ColumnDef<Order>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "id",
        header: "OrderID",
        cell: ({ row }) => (
            <div className="capitalize">{row.getValue("id")}</div>
        ),
    },
    {
        accessorKey: "image",
        header: "Image",
        cell: ({ row }) => (<div className="lowercase">
            <Image
                src={row.getValue("image")}
                width={50}
                height={50}
                alt="Picture of the author"
            />
        </div>),
    },
    {
        header: "Name",
        accessorKey: "name",
        cell: ({ row }) => {
            return <div>{row.getValue("name")}</div>
            // const amount = parseFloat(row.getValue("amount"))

            // // Format the amount as a dollar amount
            // const formatted = new Intl.NumberFormat("en-US", {
            //     style: "currency",
            //     currency: "USD",
            // }).format(amount)

            // return <div className="text-right font-medium">{formatted}</div>
        },
    },
    {
        header: "Quantity",
        accessorKey: "quantity",
        cell: ({ row }) => (
            <div>{row.getValue("quantity")}</div>
        )
    },
    {
        header: "Price",
        accessorKey: "price",
        cell: ({ row }) => {
            return <div>{row.getValue("price")}</div>
        }
    },
    {
        header: "Table Num",
        accessorKey: "table",
        cell: ({ row }) => {
            return <div>{row.getValue("table")}</div>
        }
    },
    {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => {
            if (row.getValue("status") === "On Process") {
                return <div className='bg-orange-300 rounded-sm px-1 py-1.5 text-xs text-zinc-700 font-semibold'>{row.getValue("status")}</div>
            }
            if (row.getValue("status") === "Done") {
                return <div className='bg-secondary rounded-sm px-1 py-1.5 text-xs text-white font-semibold'>{row.getValue("status")}</div>
            }
            return <div className=''>{row.getValue("status")}</div>
        }
    },
    {
        header: "Actions",
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const payment = row.original
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(payment.id)}
                        >
                            Copy payment ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View customer</DropdownMenuItem>
                        <DropdownMenuItem>View payment details</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]

const RecentOrder = () => {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    )
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const table = useReactTable<Order>({
        data: dummyData,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <Card>
            <CardHeader>
                <div className='flex flex-row justify-between items-center'>
                    <CardTitle>Recent Orders</CardTitle>
                    <div className='flex flex-row gap-2'>
                        <SearchForm />
                        <SelectPeriod />
                        <Button variant={'default'} className='bg-white text-black border text-xs'>See All Orders</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Table >
                    <TableHeader className='bg-zinc-100 !border-b-0 [&_tr]:border-b-0'>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className='!border-b-0'>
                                {headerGroup.headers.map((header, index) => {
                                    return (
                                        <TableHead key={header.id} className={`bg-zinc-100 py-4 text-center !border-b-0 ${index === 0 ? 'rounded-tl-lg rounded-bl-lg' : ''} ${index === headerGroup.headers.length - 1 ? 'rounded-tr-xl rounded-br-xl' : ''}`}>
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
                        <tr className="h-4"></tr>
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className='!border-b-0'
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
            </CardContent>
            <CardFooter>
                <p>Card Footer</p>
            </CardFooter>
        </Card>



    )
}

export default RecentOrder