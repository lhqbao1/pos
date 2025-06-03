import React from 'react'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import SelectPeriod from './select-period'
import { Soup } from 'lucide-react'
import { Progress } from '../ui/progress'

function getTypePercent(amount: number, total: number) {
    const percent = (amount / total) * 100
    return percent
}

const OrderTypes = () => {

    const orderData = [
        {
            name: "Dine-in",
            amount: 900,
            percent: getTypePercent(900, 2500)
        },
        {
            name: "Takeaway",
            amount: 600,
            percent: getTypePercent(600, 2500)

        },
        {
            name: "Online",
            amount: 500,
            percent: getTypePercent(500, 2500)

        },
        {
            name: "Vip",
            amount: 750,
            percent: getTypePercent(750, 2500)
        }
    ]
    return (
        <Card className='border-0 shadow-none p-4 gap-2'>
            <CardHeader className='p-0'>
                <div className='flex flex-row justify-between items-center'>
                    <div>
                        <CardTitle>Order Types</CardTitle>
                    </div>
                    <SelectPeriod size='sm' />
                </div>
            </CardHeader>
            <CardContent className='p-0'>
                <div className='flex flex-col gap-4.5 justify-center'>
                    {orderData.map((item, index) => {
                        return (
                            <div className='flex flex-row gap-5 items-center' key={index}>
                                <div className='p-2 bg-primary rounded-lg'>
                                    <Soup color='orange' size={20} />
                                </div>

                                <div className='flex-1'>
                                    <div className='flex flex-row justify-between mb-1'>
                                        <div className='flex gap-2'>
                                            <p className='text-xs font-bold'>{item.name}</p>
                                            <p className='text-xs font-medium text-zinc-400'>{item.percent}%</p>
                                        </div>
                                        <p className='text-xs font-bold'>{item.amount}</p>
                                    </div>
                                    <Progress className='bg-zinc-100' value={item.percent} max={100} indicatorColor="bg-[#333333]" />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

export default OrderTypes