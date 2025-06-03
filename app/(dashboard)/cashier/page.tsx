'use client'
import useBreadcrumb from '@/lib/use-breadcrumb'
import React from 'react'
import ListTables from './components/list-tables/list-tables'
import ListMealsTable from './components/list-meals-table'
import HeaderSearch from './components/header/header-search'

const Cashier = () => {
    const breadcrumb = useBreadcrumb()
    return (
        <div className='h-full flex flex-col'>
            <HeaderSearch page="Thu ngân" breadcrumbList={breadcrumb} />
            <div className='grid grid-cols-10 mt-6 gap-6 flex-1'>
                <div className="col-span-3">
                    <ListTables />
                </div>
                <div className="col-span-7">
                    <ListMealsTable />
                </div>
            </div>
        </div>
    )
}

export default Cashier