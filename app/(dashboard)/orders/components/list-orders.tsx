import React from 'react'
import SideBar from './side-bar'
import OrdersTable from './orders-table'

const ListOrders = () => {
    return (
        <div className='mt-6 flex-1 space-y-4'>
            <SideBar />
            <OrdersTable />
        </div>
    )
}

export default ListOrders
