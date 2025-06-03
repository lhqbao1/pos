import { ArrowUpRight, ListCheck } from 'lucide-react'
import React from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Chart } from './chart'
import { TopCategories } from './top-categories'
import { TableOverview } from './table-overview'
import OrderTypes from './order-types'
import RecentOrder from './recent-order'
import SelectPeriod from './select-period'


const Analytics = () => {
    return (
        <div className='col-span-3'>
            <div className="grid grid-cols-3 gap-4 px-4">
                {/*Analytics daily */}
                <div className="bg-white p-4 rounded-xl flex items-center">
                    <div className='flex flex-row justify-between items-end w-full h-full'>
                        <div className='flex flex-row gap-3 items-center'>
                            <div className='p-2 bg-secondary rounded-lg'>
                                <ListCheck color='white' />
                            </div>
                            <div className='flex flex-col justify-center'>
                                <p className='text-xs text-zinc-400'>Total Orders</p>
                                <div className='text-xl font-semibold'>12</div>
                            </div>
                        </div>
                        <div className='flex flex-row items-center gap-1 h-full pt-5.5!'>
                            <div className='bg-primary rounded-full'>
                                <ArrowUpRight size={12} color='orange' />
                            </div>
                            <p className='text-[10px] text-zinc-400'>1.58%</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl flex items-center">
                    <div className='flex flex-row justify-between items-end w-full h-full'>
                        <div className='flex flex-row gap-3 items-center'>
                            <div className='p-2 bg-secondary rounded-lg'>
                                <ListCheck color='white' />
                            </div>
                            <div className='flex flex-col justify-center'>
                                <p className='text-xs text-zinc-400'>Total Tables</p>
                                <div className='text-xl font-semibold'>2/35</div>
                            </div>
                        </div>
                        <div className='flex flex-row items-center gap-1 h-full pt-5.5!'>
                            <div className='bg-primary rounded-full'>
                                <ArrowUpRight size={12} color='orange' />
                            </div>
                            <p className='text-[10px] text-zinc-400'>1.58%</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl flex items-center">
                    <div className='flex flex-row justify-between items-end w-full h-full'>
                        <div className='flex flex-row gap-3 items-center'>
                            <div className='p-2 bg-secondary rounded-lg'>
                                <ListCheck color='white' />
                            </div>
                            <div className='flex flex-col justify-center'>
                                <p className='text-xs text-zinc-400'>Total Revenue</p>
                                <div className='text-xl font-semibold'>12.000.000đ</div>
                            </div>
                        </div>
                        <div className='flex flex-row items-center gap-1 h-full pt-5.5!'>
                            <div className='bg-primary rounded-full'>
                                <ArrowUpRight size={12} color='orange' />
                            </div>
                            <p className='text-[10px] text-zinc-400'>1.58%</p>
                        </div>
                    </div>
                </div>
                {/*Analytics week */}
                <div className="bg-white p-4 rounded-xl col-span-2">
                    <div className='flex flex-row justify-between items-center mb-4'>
                        <div>
                            <p className='text-xs text-zinc-400'>Total Revenue</p>
                            <p className='text-xl font-semibold'>120.340.000đ</p>
                        </div>
                        <SelectPeriod />
                    </div>
                    {/*Analytics chart */}
                    <Chart dateCount={7} />
                </div>
                {/*Analytics top categories */}
                <div className="bg-white p-4 rounded-xl">
                    <TopCategories />
                </div>
                {/*Analytics table overview */}
                <div className="bg-white p-4 rounded-xl col-span-2">
                    <TableOverview />
                </div>
                {/*Analytics order type */}
                <div className="bg-white rounded-xl">
                    <OrderTypes />
                </div>
                {/*Analytics recent orders */}
                <div className="bg-white rounded-xl col-span-3">
                    <RecentOrder />
                </div>
            </div>
        </div>
    )
}

export default Analytics