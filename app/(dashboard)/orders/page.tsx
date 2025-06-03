'use client'
import useBreadcrumb from '@/lib/use-breadcrumb'
import React from 'react'
import ListOrders from './components/list-orders'
import Header from '@/components/header'

const Orders = () => {
    const breadcrumb = useBreadcrumb()
    return (
        <div className='flex flex-col'>
            <Header page='Đơn hàng' breadcrumbList={breadcrumb} />
            <ListOrders />
        </div>
    )
}

export default Orders