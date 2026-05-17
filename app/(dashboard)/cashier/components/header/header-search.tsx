import React from 'react'
import { AlertCircle, Bell, Settings } from 'lucide-react'
import BreadCrumb from '@/components/breadcrumb'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useDishesQuery } from '@/features/dish/hook'
import { Dish } from '@/features/dish/type'
import { tableNumberAtom } from '@/lib/atom/table/tables'
import { useAtom } from 'jotai'
import { toast } from 'sonner'
import { useGetTableByTableNumber, useUpdateTableStatus } from '@/features/tables/hook'
import { useCreateOrder, useGetOrderByTable } from '@/features/order/hook'
import { isOrderClosed } from '@/features/order/status'
import { useCreateOrderItem, useGetOrderItemsWithTable, useUpdateOrderItemQuantity } from '@/features/order-items/hook'
import { OrderItem } from '@/features/order-items/type'


interface HeaderSearch {
    page: string,
    breadcrumbList?: string[]
}

const HeaderSearch = ({ page, breadcrumbList }: HeaderSearch) => {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const tableSessionStartRef = React.useRef<Record<string, string>>({})
    const { data: dishes } = useDishesQuery()
    // Import the atom to get the current table number
    const [currentTable] = useAtom(tableNumberAtom)
    // Fetch current table data
    const { data: currentTableData } = useGetTableByTableNumber(currentTable)
    const currentTableRecord = currentTableData?.data?.[0]

    // Activate update table status mutation
    const { mutate: updateTableStatus } = useUpdateTableStatus();

    // Fetch order by table document id
    const { data: orderByTableData } = useGetOrderByTable(currentTableRecord?.documentId)
    const orderByTableItems = orderByTableData?.data ?? []

    //Activate create order mutation
    const { mutate: createOrder } = useCreateOrder()

    // Activate create order item
    const { mutate: createOrderItem } = useCreateOrderItem()

    // Fetch order items by table number
    const { data: orderItemsByTableData } = useGetOrderItemsWithTable(currentTable)
    const orderItemsByTable = orderItemsByTableData?.data ?? []

    // Activate update order item quantity
    const { mutate: updateOrderItemQuantity } = useUpdateOrderItemQuantity()

    const getOrderItemDocumentId = (item: OrderItem) =>
        item.documentId ?? (typeof item.id === 'number' ? String(item.id) : '')

    const listDishes: Array<{ value: string; label: string; id: string, price: number, vipPrice: number }> = []

    if (dishes && dishes.data) {
        dishes.data.forEach((dish: Dish) => {
            listDishes.push({
                value: dish.name ?? "",
                label: dish.name,
                id: dish.documentId ?? "",
                price: dish.price ?? 0, // Ensure price is a number, fallback to 0 if undefined
                vipPrice: dish.vipPrice ?? 0, // Ensure vipPrice is a number, fallback to 0 if undefined
            })
        })
    }

    const chooseDish = (dishName: string, dishId: string, price: number, vipPrice: number) => {
        setValue(dishName);
        setOpen(false);
        const currentOrderIndex = orderByTableItems.length - 1
        const currentOrder = currentOrderIndex >= 0 ? orderByTableItems[currentOrderIndex] : undefined
        // Check if a table is selected
        if (!currentTable) {
            toast.error("Vui lòng chọn bàn trước khi chọn món ăn")
            return
        }

        // Check if the current table data is available
        if (!currentTableRecord?.documentId) {
            toast.error("Không tìm thấy bàn với số bàn đã chọn")
            return
        }

        // Check if the current table is available for use
        if (currentTableRecord.table_status === "Empty") {
            const sessionStartedAt =
                currentTableRecord.occupied_since ??
                tableSessionStartRef.current[currentTableRecord.documentId] ??
                new Date().toISOString()

            tableSessionStartRef.current[currentTableRecord.documentId] = sessionStartedAt

            // Update the table status to "In Use"
            updateTableStatus({
                table_id: currentTableRecord.documentId,
                table_status: "Using",
                occupied_since: sessionStartedAt,
                last_cleared_at: null,
            });
        }

        //Check if the current table has an order or not
        if (!currentOrder || isOrderClosed(currentOrder.order_status)) {
            // If no order exists, create a new order
            createOrder(
                {
                    table_id: currentTableRecord.documentId,
                    order_status: 'active',
                    is_paid: false,
                },
                {
                    onSuccess: (order) => {
                        const tableName = currentTableRecord.tableNumber;
                        // Create order item after creating order
                        createOrderItem({
                            dish_id: dishId ?? '',
                            order_id: order.data.documentId,
                            quantity: 1,
                            price_at_order: tableName.includes('vip') ? (price ?? 0) : (vipPrice ?? 0), // Ensure price is a number, fallback to 0 if undefined
                        })
                        toast.success("Gọi món thành công", {
                            description: (
                                <span className="text-green-500 !text-xs">Bạn đã đặt món thành công</span>  // 👈 Change the color here
                            ),
                            icon: <AlertCircle className="text-green-500 size-5 stroke-2" />, // 👈 Your custom icon with custom color
                            className: "!bg-green-100 !text-green-500 !font-bold !text-[15px]", // 👈 Customize the background and text color here!
                        })
                    }
                }
            )

        } else if (currentOrder.order_status === 'active') {
            let isDishExists = false;
            let currentOrderItem = {} as OrderItem;

            for (let i = 0; i < orderItemsByTable.length; i++) {
                const orderItemDishId =
                    typeof orderItemsByTable[i].dish_id === 'string'
                        ? orderItemsByTable[i].dish_id
                        : orderItemsByTable[i].dish_id?.documentId

                if (orderItemDishId === dishId) {
                    isDishExists = true;
                    currentOrderItem = orderItemsByTable[i];
                    break;
                }
            }
            if (isDishExists === true) {
                const orderItemId = getOrderItemDocumentId(currentOrderItem)

                if (!orderItemId) {
                    toast.error("Không tìm thấy mã món trong đơn để cập nhật số lượng")
                    return
                }

                updateOrderItemQuantity({
                    id: orderItemId,
                    quantity: currentOrderItem?.quantity + 1   // Increase quantity by 1           
                })
                toast.success("Cập nhật món thành công", {
                    description: (
                        <span className="text-green-500 !text-xs">Bạn đã cập nhật món thành công</span>  // 👈 Change the color here
                    ),
                    icon: <AlertCircle className="text-green-500 size-5 stroke-2" />, // 👈 Your custom icon with custom color
                    className: "!bg-green-100 !text-green-500 !font-bold !text-[15px]", // 👈 Customize the background and text color here!
                })
            } else {
                createOrderItem(
                    {
                        dish_id: dishId ?? '',
                        order_id: currentOrder?.documentId,
                        quantity: 1,
                        price_at_order: currentTableRecord.tableNumber.includes('vip') ? (price ?? 0) : (vipPrice ?? 0), // Ensure price is a number, fallback to 0 if undefined
                    },
                    {
                        onSuccess: () => {
                            toast.success("Gọi món thành công", {
                                description: (
                                    <span className="text-green-500 !text-xs">Bạn đã đặt món thành công</span>  // 👈 Change the color here
                                ),
                                icon: <AlertCircle className="text-green-500 size-5 stroke-2" />, // 👈 Your custom icon with custom color
                                className: "!bg-green-100 !text-green-500 !font-bold !text-[15px]", // 👈 Customize the background and text color here!
                            })
                        }
                    }
                )
            }
        }
    }

    return (
        <div className='dashboard-header grid grid-cols-4 gap-8 justify-center items-center'>
            <div className='flex flex-col justify-start text-start col-span-2'>
                <h2 className='text-lg font-semibold'>{page}</h2>
                <div className='text-zinc-700'>{!breadcrumbList ? "Welcome to Dashboard" : <BreadCrumb pages={breadcrumbList} />}</div>
            </div>
            <div className='relative'>
                <button className='absolute right-2' type='submit'>
                    <div className='p-2 rounded-full'>
                        <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.5 10.5a6 6 0 11-12 0 6 6 0 0112 0z" />
                        </svg>
                    </div>
                </button>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                        >
                            {value
                                ? listDishes.find((framework) => framework.value === value)?.label
                                : <p className='text-gray-400'>Tìm món ăn</p>}
                            <ChevronsUpDown className="opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[264px] p-0">
                        <Command>
                            <CommandInput placeholder="Tìm món ăn ..." className="h-9" />
                            <CommandList>
                                <CommandEmpty>No framework found.</CommandEmpty>
                                <CommandGroup>
                                    {listDishes.map((framework) => (
                                        <CommandItem
                                            key={framework.value}
                                            value={framework.value}
                                            onSelect={(currentValue) => {
                                                chooseDish(currentValue, framework.id, framework.price, framework.vipPrice)
                                            }}
                                        >
                                            {framework.label}
                                            <Check
                                                className={cn(
                                                    "ml-auto",
                                                    value === framework.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            <div className='flex flex-row gap-2 justify-between items-center'>
                <div className='bg-white p-2 h-[36px] w-[36px] flex items-center justify-center rounded-lg'>
                    <Bell />
                </div>
                <div className='bg-white p-2 h-[36px] w-[36px] flex items-center justify-center rounded-lg'>
                    <Settings />
                </div>
                <div className='flex flex-col'>
                    <p className='text-sm font-semibold'>Quán Thùy Linh</p>
                    <p className='text-xs text-zinc-700'>Admin</p>
                </div>
                <div>
                    <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    )
}

export default HeaderSearch
