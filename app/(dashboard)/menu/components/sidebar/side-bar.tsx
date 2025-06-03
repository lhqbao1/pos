'use client'
import React, { } from 'react'
import { MoreHorizontal } from 'lucide-react'
import CategoriesFilter from './filter/categories-filter'
import PriceRange from './filter/price-range'
import Rating from './filter/rating'

const SideBar = () => {
    return (
        <div className='bg-white rounded-xl h-full p-4 col-span-2'>
            <div className='flex flex-row justify-between items-center'>
                <h2 className='font-semibold text-sm'>Bộ lọc</h2>
                <MoreHorizontal size={16} />
            </div>
            <div className='flex flex-col mt-4'>
                <div className='flex flex-col'>
                    <CategoriesFilter />
                    <hr className='h-1 my-4'></hr>
                    <PriceRange />
                    <hr className='h-1 my-4'></hr>
                    <Rating />
                </div>
            </div>
        </div>
    )
}

export default SideBar