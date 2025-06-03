import { Table } from '@/features/tables/type'
import React, { } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

type TablesProps = {
    data: Table,
    isChoosing: string
}

const TableCard = ({ data, isChoosing }: TablesProps) => {

    return (
        <Card className={`py-2 px-3 cursor-pointer ${data.tableNumber === isChoosing || data.table_status === 'Using' ? 'bg-orange-200' : ''}`}>
            <CardHeader className='p-0'>
                <CardTitle>{data.tableNumber}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
                {/* <p>Card Content</p> */}
            </CardContent>
        </Card>
    )
}

export default TableCard