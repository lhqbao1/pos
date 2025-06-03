import React from 'react'
import { AlertCircle, Bell, Settings } from 'lucide-react'
import BreadCrumb from '@/components/breadcrumb'
import { Input } from '@/components/ui/input'
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
import order from '@/my-strapi-project/src/api/order/controllers/order'
import { useCreateOrderItem, useGetOrderItemsWithTable, useUpdateOrderItemQuantity } from '@/features/order-items/hook'
import { OrderItem } from '@/features/order-items/type'


interface HeaderSearch {
    page: string,
    breadcrumbList?: string[]
}

const HeaderSearch = ({ page, breadcrumbList }: HeaderSearch) => {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
    const { data: dishes, isLoading: dishesLoading, isError: dishesError } = useDishesQuery()
    // Import the atom to get the current table number
    const [currentTable] = useAtom(tableNumberAtom)
    // Fetch current table data
    const { data: currentTableData, isLoading: tableLoading, isError: tableError } = useGetTableByTableNumber(currentTable)

    // Activate update table status mutation
    const { mutate: updateTableStatus } = useUpdateTableStatus();

    // Fetch order by table document id
    const { data: orderByTableData, isLoading: orderByTableLoading, isError: orderByTableError } = useGetOrderByTable(currentTableData?.data[0].documentId)

    //Activate create order mutation
    const { mutate: createOrder } = useCreateOrder()

    // Activate create order item
    const { mutate: createOrderItem } = useCreateOrderItem()

    // Fetch order items by table number
    const { data: orderItemsByTableData, isLoading: orderItemsByTableLoading, isError: orderItemsByTableError } = useGetOrderItemsWithTable(currentTable)

    // Activate update order item quantity
    const { mutate: updateOrderItemQuantity } = useUpdateOrderItemQuantity()

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
        const currentOrderIndex = orderByTableData?.data.length - 1
        // Check if a table is selected
        if (!currentTable) {
            toast.error("Vui lòng chọn bàn trước khi chọn món ăn")
            return
        }

        // Check if the current table data is available
        if (!currentTableData) {
            toast.error("Không tìm thấy bàn với số bàn đã chọn")
            return
        }

        // Check if the current table is available for use
        if (currentTableData.data[0].table_status === "Empty") {
            // Update the table status to "In Use"
            updateTableStatus({
                table_id: currentTableData.data[0].documentId,
                table_status: "Using",
            });
        }

        //Check if the current table has an order or not
        if (!orderByTableData || orderByTableData.data.length === 0) {
            // If no order exists, create a new order
            createOrder(
                {
                    table_id: currentTableData.data[0].documentId,
                    order_status: 'active',
                    is_paid: false,
                },
                {
                    onSuccess: (order) => {
                        const tableName = currentTableData.data[0].tableNumber;
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

        } else if (orderByTableData && orderByTableData.data[currentOrderIndex].order_status === 'active') {
            let isDishExists = false;
            let currentOrderItem = {} as OrderItem;

            for (let i = 0; i < orderItemsByTableData.data.length; i++) {
                if (orderItemsByTableData.data[i].dish_id.documentId === dishId) {
                    isDishExists = true;
                    currentOrderItem = orderItemsByTableData.data[i];
                    break;
                }
            }
            if (isDishExists === true) {
                updateOrderItemQuantity({
                    id: currentOrderItem?.documentId ?? "",
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
                        order_id: orderByTableData.data[currentOrderIndex]?.documentId,
                        quantity: 1,
                        price_at_order: currentTableData.data[0].tableNumber.includes('vip') ? (price ?? 0) : (vipPrice ?? 0), // Ensure price is a number, fallback to 0 if undefined
                    },
                    {
                        onSuccess: (data) => {
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