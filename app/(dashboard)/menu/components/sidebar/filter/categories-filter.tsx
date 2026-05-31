'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
    Form,
    FormField,
    FormItem,
    FormControl,
    FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { useAtom } from 'jotai'
import { categoryFilterAtom } from '@/lib/atom/dishes/dish'
import { useDeleteCategory, useGetAllCategories } from '@/features/categories/hook'
import { Category } from '@/features/categories/type'
import { Loader2, PencilLine, RefreshCcw, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import EditCategoryDrawer from './edit-category-drawer'

// ✅ Define your schema
const formSchema = z.object({
    selected: z.array(z.string()),
})

const CategoryFilterSkeleton = () => {
    return (
        <div className='space-y-2'>
            {Array.from({ length: 5 }).map((_, index) => (
                <div className='flex items-center gap-2' key={index}>
                    <div className='h-5 w-5 animate-pulse rounded-md bg-[#efe2d3]' />
                    <div className='h-3.5 w-28 animate-pulse rounded-md bg-[#f5ebdf]' />
                </div>
            ))}
        </div>
    )
}


const CategoriesFilter = () => {
    const [categoriesFilter, setCategoriesFilter] = useAtom(categoryFilterAtom)
    const [pendingDeleteCategory, setPendingDeleteCategory] = React.useState<Category | null>(null)

    const { data, isLoading, isFetching, isError, refetch } = useGetAllCategories()
    const { mutateAsync: deleteCategory, isLoading: isDeletingCategory } = useDeleteCategory()
    const [isCategoriesReloading, setIsCategoriesReloading] = React.useState(false)
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            selected: [],
        },
    })

    const { watch, setValue } = form
    const selected = watch('selected') // live tracking
    const categories = Array.isArray(data?.data) ? data.data : []
    const isCategoriesBusy = isLoading || isFetching || isCategoriesReloading
    const shouldShowCategoriesSkeleton = isCategoriesBusy && !isError && categories.length === 0

    const handleCheckboxChange = (id: string, checked: boolean) => {
        const prev = form.getValues('selected') || []
        if (checked) {
            setValue('selected', [...prev, id])
            setCategoriesFilter([...categoriesFilter, id])
        } else {
            setValue('selected', prev.filter((item) => item !== id))
            setCategoriesFilter(categoriesFilter.filter((item) => item !== id)) // Xóa id
        }
    }

    const handleCategoriesReload = async () => {
        if (isCategoriesReloading) return
        setIsCategoriesReloading(true)
        try {
            await Promise.race([
                refetch({ cancelRefetch: true }),
                new Promise<void>((resolve) => window.setTimeout(resolve, 3000)),
            ])
        } finally {
            setIsCategoriesReloading(false)
        }
    }

    const shouldShowEmptyFilter = !shouldShowCategoriesSkeleton && (isError || categories.length === 0)

    const handleConfirmDeleteCategory = async () => {
        const category = pendingDeleteCategory
        if (!category?.documentId) {
            toast.error("Không tìm thấy mã danh mục để xoá.")
            return
        }

        try {
            await deleteCategory(category.documentId)
            toast.success("Xoá danh mục thành công.")

            const selectedAfterDelete = selected.filter((item) => item !== category.name)
            setValue('selected', selectedAfterDelete)
            setCategoriesFilter(categoriesFilter.filter((item) => item !== category.name))
            setPendingDeleteCategory(null)
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Xoá danh mục thất bại."
            toast.error(message)
        }
    }

    return (
        <>
            <Form {...form}>
                <h3 className='font-semibold text-[13px] mb-3'>Danh mục sản phẩm</h3>
                <form className="">
                    <FormField
                        control={form.control}
                        name="selected"
                        render={() => (
                            <FormItem>
                                {shouldShowCategoriesSkeleton ? (
                                    <div className='rounded-2xl border border-dashed border-[#dfd2c2] bg-[#fff9f1] p-4'>
                                        <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-[#e6d7c7] bg-white px-3 py-1 text-xs font-semibold text-[#7e5b38]'>
                                            <Loader2 className='h-3.5 w-3.5 animate-spin' />
                                            Đang tải danh mục...
                                        </div>
                                        <CategoryFilterSkeleton />
                                    </div>
                                ) : shouldShowEmptyFilter ? (
                                    <div className='rounded-2xl border border-dashed border-[#dfd2c2] bg-[#fff9f1] p-4 text-center'>
                                        <div className='mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#be7b40] shadow-sm'>
                                            <SlidersHorizontal className='h-5 w-5' />
                                        </div>
                                        <p className='text-sm font-semibold text-[#67462a]'>Không có bộ lọc available</p>
                                        <p className='mt-1 text-xs text-[#8b6a4a]'>
                                            {isLoading
                                                ? 'Đang lấy dữ liệu bộ lọc từ CMS.'
                                                : isError
                                                    ? 'Không thể tải bộ lọc từ CMS.'
                                                    : 'Chưa có danh mục nào để lọc.'}
                                        </p>
                                        <Button
                                            type='button'
                                            onClick={handleCategoriesReload}
                                            disabled={isCategoriesReloading}
                                            variant='outline'
                                            className='mt-3 rounded-full border-[#d2b18f] bg-white text-[#7c5532] hover:bg-[#fff3e8]'
                                        >
                                            {isCategoriesReloading ? (
                                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                            ) : (
                                                <RefreshCcw className='mr-2 h-4 w-4' />
                                            )}
                                            Tải lại
                                        </Button>
                                    </div>
                                ) : (
                                    <div className='relative'>
                                        {isCategoriesBusy ? (
                                            <div className='pointer-events-none absolute inset-0 z-10 flex items-start justify-end rounded-xl bg-white/55 p-2 backdrop-blur-[1px]'>
                                                <div className='inline-flex items-center gap-1 rounded-full border border-[#ead9c6] bg-white px-2 py-1 text-[11px] font-semibold text-[#7d5b3b]'>
                                                    <Loader2 className='h-3 w-3 animate-spin' />
                                                    Đang cập nhật
                                                </div>
                                            </div>
                                        ) : null}
                                        <div className="space-y-2 grid grid-cols-1 gap-2" aria-busy={isCategoriesBusy}>
                                            {categories.map((option: Category) => (
                                                <FormControl key={option.id}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={option.name}
                                                                checked={selected.includes(option.name)}
                                                                onCheckedChange={(checked) =>
                                                                    handleCheckboxChange(option.name, checked as boolean)
                                                                }
                                                                className='data-[state=checked]:bg-secondary'
                                                            />
                                                            <label htmlFor={option.name} className="text-xs font-medium leading-none">
                                                                {option.name}
                                                            </label>
                                                        </div>

                                                        <div className="flex items-center gap-1">
                                                            <EditCategoryDrawer
                                                                category={option}
                                                                trigger={
                                                                    <Button
                                                                        type="button"
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-7 w-7 rounded-full text-[#7b532b] hover:bg-[#f9ece0]"
                                                                    >
                                                                        <PencilLine className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                }
                                                            />
                                                            <Button
                                                                type="button"
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-7 w-7 rounded-full text-red-600 hover:bg-red-50"
                                                                onClick={() => setPendingDeleteCategory(option)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </FormControl>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </form>
            </Form>

            <Dialog
                open={Boolean(pendingDeleteCategory)}
                onOpenChange={(open) => {
                    if (!open && !isDeletingCategory) {
                        setPendingDeleteCategory(null)
                    }
                }}
            >
                <DialogContent className="border-[#ead8c4] bg-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#4a2f18]">
                            Xác nhận xoá danh mục
                        </DialogTitle>
                        <DialogDescription className="text-[#7a5b3a]">
                            {pendingDeleteCategory
                                ? `Bạn có chắc muốn xoá danh mục "${pendingDeleteCategory.name}"? Hành động này không thể hoàn tác.`
                                : "Xác nhận xoá danh mục."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            className="border-[#e3cfb8] bg-white text-[#6f4b2a] hover:bg-[#fff4e5] hover:text-[#6f4b2a]"
                            onClick={() => setPendingDeleteCategory(null)}
                            disabled={isDeletingCategory}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="button"
                            className="bg-red-600 text-white hover:bg-red-700 hover:text-white"
                            onClick={handleConfirmDeleteCategory}
                            disabled={isDeletingCategory}
                        >
                            {isDeletingCategory ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang xoá...
                                </span>
                            ) : (
                                "Xác nhận xoá"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default CategoriesFilter
