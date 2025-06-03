'use client'

import Header from '@/components/header'
import useBreadcrumb from '@/lib/use-breadcrumb'
import React from 'react'
import ListMeals from './components/list-meals'
import SideBar from './components/sidebar/side-bar'

const Menu = () => {
    const breadcrumb = useBreadcrumb()
    return (
        <div className='flex flex-col'>
            <Header page='Thực đơn' breadcrumbList={breadcrumb} />
            <div className='grid grid-cols-9 mt-6 gap-6 flex-1'>
                <SideBar />
                <ListMeals />
            </div>
        </div>
    )
}

export default Menu