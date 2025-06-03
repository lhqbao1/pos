'use client'
import { useGetTables, useUpdateTableStatus } from '@/features/tables/hook'
import React, { useState } from 'react'
import TableCard from './table-card'
import { Table } from '@/features/tables/type'
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from '@/components/ui/button'
import { useGetOrderItemsWithTable } from '@/features/order/hook'
import { useAtom } from 'jotai'
import { tableIdAtom, tableNumberAtom } from '@/lib/atom/table/tables'
import ListCategory from './list-category'


const ListTables = () => {
    const { data, isLoading, isError } = useGetTables()
    const [isUsing, setIsUsing] = useState('')
    const [open, setOpen] = React.useState(false)
    const [currentTable, setCurrentTable] = useAtom(tableNumberAtom)
    const [currentTableId, setCurrentTableId] = useAtom(tableIdAtom)

    if (isLoading) return <div>....Loading</div>
    if (isError) return <div>....Error</div>

    const onCLickTable = (tableNumber: string, tableId: string) => {
        setIsUsing(tableNumber)
        setCurrentTable(tableNumber)
        setCurrentTableId(tableId)
    }

    return (
        <div className='grid grid-cols-4 gap-2'>
            {data.data.map((item: Table, index: number) => {
                return (
                    <div onClick={() => onCLickTable(item.tableNumber, item.documentId ?? "")} onDoubleClick={() => setOpen(true)} key={index}>
                        <TableCard isChoosing={isUsing} data={item} />
                    </div>
                )
            })}
            <Drawer open={open} onOpenChange={setOpen} direction='bottom'>
                <DrawerContent className='min-h-[300px] px-8 pt-4 pb-8'>
                    <DrawerHeader>
                        <DrawerTitle className='text-xl uppercase'>Danh sách danh mục/ món ăn</DrawerTitle>
                    </DrawerHeader>
                    <ListCategory />
                </DrawerContent>
            </Drawer>
        </div>
    )
}

export default ListTables