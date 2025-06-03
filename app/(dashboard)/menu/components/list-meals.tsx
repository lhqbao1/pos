'use client'
import React from 'react'
import { Sort } from './list-meals/sort'
import MealCart from '@/components/home/side/meal-cart'
import { useDishesQuery } from '@/features/dish/hook'
import { PageSize } from './list-meals/page-size'
import { useAtom } from 'jotai'
import { categoryFilterAtom, pageAtom, pageSizeAtom, priceFilterAtom, searchFilterAtom, sortFilterAtom } from '@/lib/atom/dishes/dish'
import { PaginationSection } from './list-meals/pagination'
import { Dish } from '@/features/dish/type'
import SearchForm from './list-meals/search-form'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import CreateMeal from './crud-meal/create-meal'

const ListMeals = () => {
    const [pageSize] = useAtom(pageSizeAtom)
    const [page] = useAtom(pageAtom)
    const [categoriesFilter] = useAtom(categoryFilterAtom)
    const [priceFilter] = useAtom(priceFilterAtom)
    const [searchFilter] = useAtom(searchFilterAtom)
    const [sortFilter] = useAtom(sortFilterAtom)

    const { data, isLoading, isError } = useDishesQuery({
        page: page,
        pageSize: pageSize,
        category: categoriesFilter,
        minPrice: priceFilter[0],
        maxPrice: priceFilter[1],
        search: searchFilter,
        sort: sortFilter
    })

    const pageCount = data?.meta?.pagination?.pageCount ?? 1

    if (isLoading) return <p>Loading meals...</p>
    if (isError) return <p>Failed to load meals.</p>

    return (
        <div className='col-span-7 bg-white rounded-xl p-4'>
            <div className='flex flex-row justify-between'>
                <div className='flex flex-row gap-2 items-center'>
                    <SearchForm />
                    <Dialog>
                        <DialogTrigger>
                            <Button className='bg-secondary rounded-full hover:bg-secondary hover:opacity-85 cursor-pointer'>Thêm món</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tạo món mới</DialogTitle>
                                <CreateMeal />
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                </div>
                <Sort />
            </div>
            <div className='grid grid-cols-5 mt-2'>
                {data?.data?.map((item: Dish, index: number) => {
                    return (
                        <MealCart data={item} key={index} />
                    )
                })}
            </div>
            <div className='flex flex-row justify-between mt-4'>
                <div className='flex flex-row gap-1 justify-center items-center'>
                    <p>Showing</p>
                    <PageSize />
                    <p>out of {data?.meta?.pagination?.total}</p>
                </div>
                <div>
                    <PaginationSection pageSize={pageSize} currentPage={page} pageCount={pageCount} />
                </div>
            </div>
        </div>
    )
}

export default ListMeals