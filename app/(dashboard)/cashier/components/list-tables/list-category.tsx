'use client'
import { Button } from '@/components/ui/button'
import { useGetAllCategories } from '@/features/categories/hook'
import { useGetDishesByCategory } from '@/features/dish/hook'
import React, { useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image'
import { Category } from '@/features/categories/type'
import { Dish } from '@/features/dish/type'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { formattedNumber } from '@/lib/format-vnd'
import { useAtom } from 'jotai'
import { tableNumberAtom } from '@/lib/atom/table/tables'
import { useGetTableByTableNumber, useUpdateTableStatus } from '@/features/tables/hook'
import { useCreateOrder, useGetOrderByTable } from '@/features/order/hook'
import { toast } from 'sonner'
import { useCreateOrderItem, useGetOrderItemsWithTable, useUpdateOrderItemQuantity } from '@/features/order-items/hook'
import { OrderItem } from '@/features/order-items/type'

const ListCategory = () => {
    const [selectedCategory, setSelectedCategory] = useState('');

    const [currentTable] = useAtom(tableNumberAtom)

    // Fetch categories
    const { data, isLoading, isError } = useGetAllCategories()

    // Fetch dishes by selected category
    const { data: dishesData, isLoading: dishesLoading, isError: dishesError } = useGetDishesByCategory(selectedCategory)

    // Fetch current table data
    const { data: currentTableData, isLoading: tableLoading, isError: tableError } = useGetTableByTableNumber(currentTable)

    // Fetch order by table document id
    const { data: orderByTableData, isLoading: orderByTableLoading, isError: orderByTableError } = useGetOrderByTable(currentTableData?.data[0].documentId)

    // Fetch order items by table number
    const { data: orderItemsByTableData, isLoading: orderItemsByTableLoading, isError: orderItemsByTableError } = useGetOrderItemsWithTable(currentTable)

    //Activate create order mutation
    const { mutate: createOrder } = useCreateOrder()

    // Activate update table status mutation
    const { mutate: updateTableStatus } = useUpdateTableStatus();

    // Activate create order item
    const { mutate: createOrderItem } = useCreateOrderItem()

    // Activate update order item quantity
    const { mutate: updateOrderItemQuantity } = useUpdateOrderItemQuantity()

    if (isLoading) return <div>...Loading</div>
    if (isError) return <div>...Error</div>


    const handleClickCategoryCard = (categoryName: string) => {
        setSelectedCategory(categoryName)
    }

    if (dishesData && dishesData.data.length > 0) {
        const ChooseMeal = (dish: Dish) => {
            //Get current order by table
            const currentOrderIndex = orderByTableData?.data.length - 1

            //Check if table is empty or not, if yes change the status to Using
            if (currentTableData.data[0].table_status === 'Empty') {
                updateTableStatus({
                    table_id: currentTableData.data[0].documentId,
                    table_status: 'Using',
                })
            }

            //Check if order already exists for this table
            if (orderByTableData && orderByTableData.data.length === 0 || orderByTableData.data[currentOrderIndex].order_status === 'paid') {
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
                                dish_id: dish.documentId ?? '',
                                order_id: order.data.documentId,
                                quantity: 1,
                                price_at_order: tableName.includes('vip') ? (dish.price ?? 0) : (dish.vipPrice ?? 0), // Ensure price is a number, fallback to 0 if undefined
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

                // If order exists and is not paid, create order item
            }
            // Check if order exists and is active
            else if (orderByTableData && orderByTableData.data[currentOrderIndex].order_status === 'active') {
                let isDishExists = false;
                let currentOrderItem = {} as OrderItem;

                for (let i = 0; i < orderItemsByTableData.data.length; i++) {
                    if (orderItemsByTableData.data[i].dish_id.documentId === dish.documentId) {
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
                            dish_id: dish.documentId ?? '',
                            order_id: orderByTableData.data[currentOrderIndex]?.documentId,
                            quantity: 1,
                            price_at_order: currentTableData.data[0].tableNumber.includes('vip') ? (dish.price ?? 0) : (dish.vipPrice ?? 0), // Ensure price is a number, fallback to 0 if undefined
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
            // If order exists and is cancelled, show error message 
            else {
                toast.error("Đã xảy ra lỗi", {
                    description: (
                        <span className="text-red-500 !text-xs">Vui lòng thử lại sau</span>  // 👈 Change the color here
                    ),
                    icon: <AlertCircle className="text-red-500 size-5 stroke-2" />, // 👈 Your custom icon with custom color
                    className: "!bg-red-100 !text-red-500 !font-bold !text-[15px]", // 👈 Customize the background and text color here!
                })
            }

            //Create order item

        }

        return (
            <div className='mt-5'>
                {dishesLoading && <p>Loading dishes...</p>}
                {dishesError && <p>Error loading dishes</p>}
                {dishesData && dishesData.data.length > 0 && (
                    <div>
                        <Button className='bg-black' onClick={() => setSelectedCategory('')}>
                            <ArrowLeft color='white' size={20} strokeWidth={3} />
                        </Button>
                        <div className='grid grid-cols-8 gap-3 mt-3'>
                            {dishesData.data.map((dish: Dish, index: number) => (
                                <Card key={index} className='gap-2 py-3 px-0' onClick={() => ChooseMeal(dish)}>
                                    <CardHeader className='py-0 px-3'>
                                        <CardTitle>{dish.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className='p-0'>
                                        <Image
                                            src={dish?.image?.url ? `${process.env.NEXT_PUBLIC_BACKEND_URL}${dish.image.url}` : `https://lh3.googleusercontent.com/gps-cs-s/AC9h4np2nCF2_67uvFaXBDH4da5xhtg5FUTqQzLXTk7Ugj2grs9pD0MxUBvct5WKi8tjuF8et82JOJYVb4qlwy_v2HOge4exFAmd4dI8ClzetLa3ltyYXATUHpnuocg3bZ44BhHSJ2hl=s1360-w1360-h1020-rw`}
                                            width={200}
                                            height={200}
                                            alt={dish.name}
                                            className='w-full h-[100px] object-cover'
                                        />
                                    </CardContent>
                                    <CardFooter className='py-0 px-3'>
                                        <p>{formattedNumber(dish?.price ?? 0)}</p>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className='grid grid-cols-6 justify-between gap-5'>
            {data.data.map((item: Category, index: number) => {
                return (
                    <Card
                        key={index}
                        onClick={() => handleClickCategoryCard(item.name)}
                        className={`cursor-pointer pb-0 gap-2 pt-3 hover:scale-105 transition-transform duration-400 hover:shadow-lg`}
                    >
                        <CardHeader className='py-0 text-center uppercase font-semibold'>
                            {item.name}
                        </CardHeader>
                        <CardContent className="p-0">
                            <Image
                                src={`${process.env.NEXT_PUBLIC_BACKEND_URL}${item.image.url}`}
                                width={200}
                                height={200}
                                alt={item.name}
                                className='w-full h-[150px] rounded-bl-xl rounded-br-xl'
                            />
                        </CardContent>
                    </Card>
                )
            })}
            {/* Show dishes */}
        </div>
    )
}

export default ListCategory