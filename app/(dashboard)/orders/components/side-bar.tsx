'use client'

import React from 'react'
import { useAtom } from 'jotai'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarIcon, RefreshCcw } from 'lucide-react'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toLocalISOString } from '@/lib/formatDate'
import { endDateFilterAtom, startDateFilterAtom, statusFilterAtom } from '@/lib/atom/orders/orders'
import { ORDER_STATUS_FILTER_OPTIONS, OrderStatusFilter } from '@/features/order/status'

const toEndOfDayISOString = (date: Date) => {
    const next = new Date(date)
    next.setHours(23, 59, 59, 999)
    return toLocalISOString(next)
}

const SideBar = () => {
    const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom)
    const [, setStartDateFilter] = useAtom(startDateFilterAtom)
    const [, setEndDateFilter] = useAtom(endDateFilterAtom)

    const [startDateValue, setStartDateValue] = React.useState<Date>()
    const [endDateValue, setEndDateValue] = React.useState<Date>(new Date())

    React.useEffect(() => {
        const validStatuses = new Set(ORDER_STATUS_FILTER_OPTIONS.map((option) => option.value))
        if (!validStatuses.has(statusFilter)) {
            setStatusFilter("all")
        }
    }, [setStatusFilter, statusFilter])

    const onSelectStartDate = (date?: Date) => {
        if (!date) {
            setStartDateValue(undefined)
            setStartDateFilter(undefined)
            return
        }

        setStartDateValue(date)
        setStartDateFilter(toLocalISOString(date))
    }

    const onSelectEndDate = (date?: Date) => {
        if (!date) {
            const today = new Date()
            setEndDateValue(today)
            setEndDateFilter(toEndOfDayISOString(today))
            return
        }

        setEndDateValue(date)
        setEndDateFilter(toEndOfDayISOString(date))
    }

    const resetFilters = () => {
        const today = new Date()
        setStatusFilter("all")
        setStartDateValue(undefined)
        setStartDateFilter(undefined)
        setEndDateValue(today)
        setEndDateFilter(toEndOfDayISOString(today))
    }

    return (
        <div className='relative overflow-hidden rounded-2xl border border-[#ead8c4] bg-gradient-to-r from-[#fffefb] via-[#fff8ef] to-[#fffdf8] p-5 shadow-sm'>
            <div className='pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-primary/60 blur-3xl' />
            <div className='relative'>
                <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
                    <div>
                        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[#a67a54]'>
                            Bộ lọc đơn hàng
                        </p>
                        <h3 className='mt-1 text-lg font-bold text-[#4a2f18]'>
                            Theo dõi trạng thái và thời gian bán
                        </h3>
                    </div>
                    <Button
                        type='button'
                        variant='outline'
                        onClick={resetFilters}
                        className='h-9 border-[#e2ccb2] bg-white text-[#6f4b2a] hover:bg-[#fff4e5] hover:text-[#6f4b2a]'
                    >
                        <RefreshCcw className='mr-2 h-4 w-4' />
                        Đặt lại
                    </Button>
                </div>

                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                    <div>
                        <p className='mb-2 text-sm font-semibold text-[#5b3c1f]'>Trạng thái</p>
                        <Select
                            value={statusFilter}
                            onValueChange={(value) => setStatusFilter(value as OrderStatusFilter)}
                        >
                            <SelectTrigger className="w-full border-[#e3cfb8] bg-white text-[#4a2f18]">
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                {ORDER_STATUS_FILTER_OPTIONS.map((statusOption) => (
                                    <SelectItem key={statusOption.value} value={statusOption.value}>
                                        {statusOption.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <p className='mb-2 text-sm font-semibold text-[#5b3c1f]'>Từ ngày</p>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start border-[#e3cfb8] bg-white text-left font-normal text-[#4a2f18]",
                                        !startDateValue && "text-[#9d7f62]"
                                    )}
                                >
                                    <CalendarIcon className='mr-2 h-4 w-4' />
                                    {startDateValue
                                        ? format(startDateValue, "PPP", { locale: vi })
                                        : <span>Chọn ngày bắt đầu</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={startDateValue}
                                    onSelect={(date) => onSelectStartDate(date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div>
                        <p className='mb-2 text-sm font-semibold text-[#5b3c1f]'>Đến ngày</p>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start border-[#e3cfb8] bg-white text-left font-normal text-[#4a2f18]",
                                        !endDateValue && "text-[#9d7f62]"
                                    )}
                                >
                                    <CalendarIcon className='mr-2 h-4 w-4' />
                                    {endDateValue
                                        ? format(endDateValue, "PPP", { locale: vi })
                                        : <span>Chọn ngày kết thúc</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={endDateValue}
                                    onSelect={(date) => onSelectEndDate(date)}
                                    initialFocus
                                    disabled={(date) => {
                                        if (!date) return false

                                        if (startDateValue) {
                                            return date < startDateValue || date > new Date()
                                        }

                                        return date > new Date()
                                    }}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SideBar
