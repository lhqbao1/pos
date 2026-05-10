import { Table } from '@/features/tables/type'
import React, { } from 'react'
import {
    Card,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { cn } from '@/lib/utils'
import { formatElapsedDuration } from '@/lib/format-duration'

type TablesProps = {
    data: Table,
    isChoosing: string
    nowMs: number
}

const TableCard = ({ data, isChoosing, nowMs }: TablesProps) => {
    const isSelected = data.tableNumber === isChoosing

    const statusConfig: Record<string, { label: string; tone: string; dot: string }> = {
        Empty: {
            label: 'Trống',
            tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            dot: 'bg-emerald-500',
        },
        Using: {
            label: 'Đang dùng',
            tone: 'bg-amber-50 text-amber-700 border-amber-200',
            dot: 'bg-amber-500',
        },
        Reserved: {
            label: 'Đặt trước',
            tone: 'bg-sky-50 text-sky-700 border-sky-200',
            dot: 'bg-sky-500',
        },
        Cleaning: {
            label: 'Đang dọn',
            tone: 'bg-violet-50 text-violet-700 border-violet-200',
            dot: 'bg-violet-500',
        },
        Disabled: {
            label: 'Ngưng dùng',
            tone: 'bg-zinc-100 text-zinc-600 border-zinc-200',
            dot: 'bg-zinc-500',
        },
    }

    const status = statusConfig[data.table_status] ?? statusConfig.Empty
    const tableTypeLabel = data.type === 'Vip' ? 'VIP' : 'Thường'
    const tableName = data.displayName || `Bàn ${data.tableNumber}`
    const usingDuration = data.table_status === 'Using' && data.occupied_since
        ? formatElapsedDuration(data.occupied_since, nowMs)
        : null

    return (
        <Card
            className={cn(
                'cursor-pointer overflow-hidden border-[#ead8c4] bg-white py-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(168,118,66,0.14)]',
                isSelected
                    ? 'border-secondary shadow-[0_12px_24px_rgba(194,123,55,0.18)] ring-1 ring-secondary/30'
                    : ''
            )}
        >
            <CardHeader className='space-y-2 p-3'>
                <div className='flex items-start justify-between gap-2'>
                    <CardTitle className='text-base font-bold text-[#3f2a18]'>#{data.tableNumber}</CardTitle>
                    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', status.tone)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                        {status.label}
                    </span>
                </div>

                <p className='line-clamp-1 text-sm font-medium text-[#6f4f30]'>{tableName}</p>

                <div className='flex items-center gap-2 text-[11px] font-semibold text-[#8b6a49]'>
                    <span className='rounded-full bg-[#fff4e6] px-2 py-0.5'>{tableTypeLabel}</span>
                    <span className='rounded-full bg-[#f7efe5] px-2 py-0.5'>{data.capacity ?? 0} chỗ</span>
                    {data.zone ? <span className='rounded-full bg-[#f5f1ea] px-2 py-0.5'>{data.zone}</span> : null}
                </div>

                {usingDuration ? (
                    <div className='inline-flex w-fit items-center rounded-lg border border-[#f4d8b3] bg-[#fff5e8] px-2 py-1 text-[11px] font-semibold text-[#9b642f]'>
                        Thời gian dùng: {usingDuration}
                    </div>
                ) : null}
            </CardHeader>
        </Card>
    )
}

export default TableCard
