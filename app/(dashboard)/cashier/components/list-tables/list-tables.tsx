'use client'
import { useGetTables } from '@/features/tables/hook'
import React, { useEffect, useState } from 'react'
import TableCard from './table-card'
import { Table } from '@/features/tables/type'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAtom } from 'jotai'
import { tableIdAtom, tableNumberAtom } from '@/lib/atom/table/tables'


const ListTables = () => {
    const { data, isInitialLoading, isFetching, isError, refetch } = useGetTables()
    const [isManualRefetching, setIsManualRefetching] = useState(false)
    const [currentTable, setCurrentTable] = useAtom(tableNumberAtom)
    const [, setCurrentTableId] = useAtom(tableIdAtom)
    const [nowMs, setNowMs] = useState(() => Date.now())

    const showSkeleton = isInitialLoading || (isFetching && (!data?.data?.length || isManualRefetching))

    useEffect(() => {
        const timer = setInterval(() => setNowMs(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])

    const handleRefetch = async () => {
        setIsManualRefetching(true)
        try {
            await refetch()
        } finally {
            setIsManualRefetching(false)
        }
    }

    if (showSkeleton) {
        return (
            <div className='grid grid-cols-2 gap-3'>
                {Array.from({ length: 12 }).map((_, index) => (
                    <div key={index} className='rounded-xl border border-zinc-100 bg-white p-3'>
                        <Skeleton className='h-5 w-14' />
                        <Skeleton className='mt-2 h-4 w-full' />
                        <div className='mt-2 flex gap-2'>
                            <Skeleton className='h-5 w-16 rounded-full' />
                            <Skeleton className='h-5 w-12 rounded-full' />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (isError) {
        return (
            <div className='bg-white rounded-xl p-4 flex flex-col gap-3'>
                <p className='text-sm text-red-500 font-medium'>Không tải được danh sách bàn.</p>
                <Button className='bg-secondary text-white hover:bg-secondary/90 hover:text-white' onClick={handleRefetch}>
                    Tải lại
                </Button>
            </div>
        )
    }

    if (!data?.data?.length) {
        return (
            <div className='bg-white rounded-xl p-4 flex flex-col gap-3'>
                <p className='text-sm text-zinc-500 font-medium'>Chưa có bàn nào để hiển thị.</p>
                <Button className='bg-secondary text-white hover:bg-secondary/90 hover:text-white' onClick={handleRefetch}>
                    Tải lại
                </Button>
            </div>
        )
    }

    const onCLickTable = (tableNumber: string, tableId: string) => {
        setCurrentTable(tableNumber)
        setCurrentTableId(tableId)
    }

    return (
        <div className='grid grid-cols-2 gap-3'>
            {data.data.map((item: Table, index: number) => {
                return (
                    <div onClick={() => onCLickTable(item.tableNumber, item.documentId ?? "")} key={index}>
                        <TableCard isChoosing={currentTable ?? ''} data={item} nowMs={nowMs} />
                    </div>
                )
            })}
        </div>
    )
}

export default ListTables
