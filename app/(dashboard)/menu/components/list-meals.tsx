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
import { Loader2, PencilLine, RefreshCcw, Sparkles, Trash2, UtensilsCrossed } from 'lucide-react'
import ImportMeals from './crud-meal/import-meals'
import CreateCategoryDrawer from './crud-meal/create-category-drawer'
import CreateMealDrawer from './crud-meal/create-meal-drawer'
import { useDeleteDish } from '@/features/dish/hook'
import { toast } from 'sonner'

type MealsEmptyStateProps = {
    isLoading: boolean
    isError: boolean
    isReloading: boolean
    onRetry: () => void
}

const MealCardSkeleton = () => {
    return (
        <div className='overflow-hidden rounded-2xl border border-[#efe1d1] bg-white p-3'>
            <div className='h-[170px] w-full animate-pulse rounded-xl bg-[#f3e7d9]' />
            <div className='mt-3 space-y-2'>
                <div className='h-4 w-2/3 animate-pulse rounded-md bg-[#f3e7d9]' />
                <div className='h-3 w-1/3 animate-pulse rounded-md bg-[#f6ecdf]' />
                <div className='mt-3 flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <div className='h-7 w-14 animate-pulse rounded-full bg-[#f6ecdf]' />
                        <div className='h-7 w-14 animate-pulse rounded-full bg-[#f1ede8]' />
                    </div>
                    <div className='h-6 w-24 animate-pulse rounded-md bg-[#f3e7d9]' />
                </div>
            </div>
        </div>
    )
}

type MealsLoadingOverlayProps = {
    visible: boolean
}

const MealsLoadingOverlay = ({ visible }: MealsLoadingOverlayProps) => {
    if (!visible) return null

    return (
        <div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/55 backdrop-blur-[1px]'>
            <div className='inline-flex items-center gap-2 rounded-full border border-[#e7d6c2] bg-white px-4 py-2 text-xs font-semibold text-[#6f4f30] shadow-sm'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Đang cập nhật món ăn...
            </div>
        </div>
    )
}

const MealsEmptyState = ({ isLoading, isError, isReloading, onRetry }: MealsEmptyStateProps) => {
    let subTitle = "Hiện chưa có món ăn nào trong hệ thống."

    if (isLoading) {
        subTitle = "Đang đồng bộ dữ liệu thực đơn từ CMS."
    } else if (isError) {
        subTitle = "Không thể lấy dữ liệu từ CMS. Vui lòng thử lại."
    }

    return (
        <div className='col-span-full mt-2'>
            <div className='relative overflow-hidden rounded-3xl border border-[#e8dccc] bg-gradient-to-br from-[#fffaf3] via-[#fff3e4] to-[#fffdf8] p-8'>
                <div className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#ffd6a8]/40 blur-2xl' />
                <div className='pointer-events-none absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-[#f6c88b]/30 blur-2xl' />
                <div className='relative z-10 mx-auto max-w-lg text-center'>
                    <div className='mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_10px_30px_rgba(196,142,79,0.16)]'>
                        <UtensilsCrossed className='h-10 w-10 text-[#c27b37]' />
                    </div>
                    <div className='mb-2 flex items-center justify-center gap-2 text-[#c27b37]'>
                        <Sparkles className='h-4 w-4' />
                        <p className='text-xs font-semibold uppercase tracking-[0.22em]'>Thực đơn trống</p>
                    </div>
                    <h3 className='text-2xl font-bold text-[#4a2f18]'>Không có món ăn nào</h3>
                    <p className='mx-auto mt-2 max-w-md text-sm text-[#7b5b3e]'>{subTitle}</p>
                    <div className='mt-6'>
                        <Button
                            onClick={onRetry}
                            disabled={isReloading}
                            className='rounded-full bg-[#c27b37] px-6 text-white hover:bg-[#b06e31] disabled:opacity-80'
                        >
                            {isReloading ? (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                                <RefreshCcw className='mr-2 h-4 w-4' />
                            )}
                            Tải lại
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const ListMeals = () => {
    const [pageSize] = useAtom(pageSizeAtom)
    const [page] = useAtom(pageAtom)
    const [categoriesFilter] = useAtom(categoryFilterAtom)
    const [priceFilter] = useAtom(priceFilterAtom)
    const [searchFilter] = useAtom(searchFilterAtom)
    const [sortFilter] = useAtom(sortFilterAtom)

    const { data, isLoading, isFetching, isError, refetch } = useDishesQuery({
        page: page,
        pageSize: pageSize,
        category: categoriesFilter,
        minPrice: priceFilter[0],
        maxPrice: priceFilter[1],
        search: searchFilter,
        sort: sortFilter
    })
    const [isMealsReloading, setIsMealsReloading] = React.useState(false)
    const [deletingDishId, setDeletingDishId] = React.useState<string | null>(null)
    const { mutateAsync: deleteDish } = useDeleteDish()

    const handleMealsReload = async () => {
        if (isMealsReloading) return
        setIsMealsReloading(true)
        try {
            await Promise.race([
                refetch({ cancelRefetch: true }),
                new Promise<void>((resolve) => window.setTimeout(resolve, 3000)),
            ])
        } finally {
            setIsMealsReloading(false)
        }
    }

    const dishes = Array.isArray(data?.data) ? data.data : []
    const total = data?.meta?.pagination?.total ?? dishes.length
    const pageCount = Math.max(data?.meta?.pagination?.pageCount ?? 0, 1)
    const hasMeals = dishes.length > 0
    const isMealsBusy = isLoading || isFetching || isMealsReloading
    const shouldShowMealsSkeleton = isMealsBusy && !isError && dishes.length === 0

    const handleDeleteDish = async (dish: Dish) => {
        if (!dish.documentId) {
            toast.error('Không tìm thấy mã món ăn để xoá.')
            return
        }

        const isConfirmed = window.confirm(`Bạn có chắc muốn xoá món "${dish.name}"?`)
        if (!isConfirmed) return

        setDeletingDishId(dish.documentId)
        try {
            await deleteDish(dish.documentId)
            toast.success('Xoá món ăn thành công.')
            await handleMealsReload()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Xoá món ăn thất bại.'
            toast.error(message)
        } finally {
            setDeletingDishId(null)
        }
    }

    return (
        <div className='col-span-7 flex h-full flex-col rounded-2xl border border-[#efdfcd] bg-white/90 p-4 shadow-[0_12px_30px_rgba(164,114,64,0.08)]'>
            <div className='rounded-2xl border border-[#e9d6c0] bg-gradient-to-r from-[#fffefb] via-[#fff8ef] to-[#fffdf8] p-3 shadow-[0_8px_22px_rgba(168,118,66,0.08)]'>
                <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
                    <div className='flex flex-1 flex-wrap items-center gap-2'>
                        <div className='w-full sm:w-[340px]'>
                            <SearchForm />
                        </div>
                        <ImportMeals onImported={handleMealsReload} />
                        <CreateCategoryDrawer />
                        <CreateMealDrawer />
                    </div>
                    <div className='self-end xl:self-auto'>
                        <Sort />
                    </div>
                </div>
            </div>
            <div className='mt-4 flex flex-1 flex-col space-y-3'>
                {hasMeals && isMealsBusy ? (
                    <div className='inline-flex items-center gap-2 rounded-full border border-[#ead9c6] bg-[#fffaf3] px-3 py-1 text-xs font-semibold text-[#7c5a3a]'>
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                        Đang tải lại dữ liệu thực đơn
                    </div>
                ) : null}

                <div className='relative'>
                    <MealsLoadingOverlay visible={hasMeals && isMealsBusy} />
                    <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' aria-busy={isMealsBusy}>
                        {shouldShowMealsSkeleton ? (
                            Array.from({ length: 8 }).map((_, index) => <MealCardSkeleton key={index} />)
                        ) : hasMeals && !isError ? (
                            dishes.map((item: Dish) => {
                                return (
                                    <MealCart
                                        data={item}
                                        key={item.documentId ?? item.id}
                                        actions={
                                            <div className='flex items-center gap-1 rounded-full border border-white/90 bg-white/95 p-1.5 shadow-md backdrop-blur'>
                                                <CreateMealDrawer
                                                    mode='edit'
                                                    dish={item}
                                                    trigger={
                                                        <Button
                                                            type='button'
                                                            size='icon'
                                                            variant='ghost'
                                                            className='h-7 w-7 rounded-full text-[#7b532b] hover:bg-[#f9ece0]'
                                                        >
                                                            <PencilLine className='h-3.5 w-3.5' />
                                                        </Button>
                                                    }
                                                />
                                                <Button
                                                    type='button'
                                                    size='icon'
                                                    variant='ghost'
                                                    className='h-7 w-7 rounded-full text-red-600 hover:bg-red-50'
                                                    onClick={() => handleDeleteDish(item)}
                                                    disabled={deletingDishId === item.documentId}
                                                >
                                                    {deletingDishId === item.documentId ? (
                                                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                                    ) : (
                                                        <Trash2 className='h-3.5 w-3.5' />
                                                    )}
                                                </Button>
                                            </div>
                                        }
                                    />
                                )
                            })
                        ) : (
                            <MealsEmptyState
                                isLoading={isLoading}
                                isError={isError}
                                isReloading={isMealsReloading}
                                onRetry={handleMealsReload}
                            />
                        )}
                    </div>
                </div>
            </div>
            {hasMeals && !isError && (
                <div className='mt-auto pt-5'>
                    <div className='flex flex-col gap-3 border-t border-[#eedfcf] pt-4 md:flex-row md:items-center md:justify-between'>
                    <div className='flex flex-row items-center gap-2 text-[#5e4733]'>
                        <p className='text-sm font-medium'>Hiển thị</p>
                        <PageSize />
                        <p className='text-sm'>trên tổng {total} món</p>
                    </div>
                    <div>
                        <PaginationSection pageSize={pageSize} currentPage={page} pageCount={pageCount} />
                    </div>
                </div>
                </div>
            )}
        </div>
    )
}

export default ListMeals
