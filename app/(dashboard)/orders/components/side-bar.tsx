'use client'
import { MoreHorizontal } from 'lucide-react'
import React from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAtom } from 'jotai'
import { endDateFilterAtom, startDateFilterAtom, statusFilterAtom } from '@/lib/atom/orders/orders'
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { toLocalISOString } from '@/lib/formatDate'

const SideBar = () => {
    // State to manage the selected category and date
    const [statusValue, setStatusValue] = React.useState('all')
    const [startDateValue, setStartDateValue] = React.useState<Date>()
    const [endDateValue, setEndDateValue] = React.useState<Date>(new Date())

    // Atom to manage the status filter
    const [statusFilter, setStatusFilter] = useAtom(statusFilterAtom)
    const [startDateFilter, setStartDateFilter] = useAtom(startDateFilterAtom)
    const [endDateFilter, setEndDateFilter] = useAtom(endDateFilterAtom)

    const onSelectStartDate = (date: Date) => {
        const startDateFormat = toLocalISOString(date)
        setStartDateValue(date)
        setStartDateFilter(startDateFormat)
    }

    const onSelectEndDate = (date: Date) => {
        const endDateFormat = toLocalISOString(date)
        setEndDateValue(date)
        setEndDateFilter(endDateFormat)
    }

    return (
        <div className='bg-white rounded-xl h-full p-4'>
            <div className='grid grid-cols-4 gap-8'>
                {/* Category filter dropdown */}
                <div>
                    <p className='mb-2 text-sm font-semibold'>Trạng thái</p>
                    <Select
                        value={statusValue}
                        onValueChange={(value) => {
                            setStatusFilter(value)
                            setStatusValue(value)
                        }}
                        defaultValue='all'
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Fruits</SelectLabel>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="empty">Chưa được tạo</SelectItem>
                                <SelectItem value="active">Đang sử dụng</SelectItem>
                                <SelectItem value="paid">Đã thanh toán</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                {/* Start date filter dropdown */}
                <div>
                    <p className='mb-2 text-sm font-semibold'>Từ ngày</p>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !startDateValue && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon />
                                {startDateValue ? format(startDateValue, "PPP") : <span>Chọn ngày</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={startDateValue}
                                onSelect={(date) => {
                                    if (date) {
                                        onSelectStartDate(date)
                                    }
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* End date filter dropdown */}
                <div>
                    <p className='mb-2 text-sm font-semibold'>Đến ngày</p>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !endDateValue && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon />
                                {endDateValue ? format(endDateValue, "PPP") : <span>Chọn ngày</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={endDateValue}
                                onSelect={(date) => onSelectEndDate(date)}
                                initialFocus
                                disabled={(date) => {
                                    // Disable dates before the start date
                                    if (date) {
                                        if (startDateValue) {
                                            return date < startDateValue || date > new Date()
                                        }
                                        return date > new Date()
                                    }
                                    return false
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    )
}

export default SideBar