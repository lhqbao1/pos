'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import React, { } from 'react'
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
import { useGetAllCategories } from '@/features/categories/hook'
import { Category } from '@/features/categories/type'

// ✅ Define your schema
const formSchema = z.object({
    selected: z.array(z.string()).min(1, { message: 'Choose at least one item' }),
})


const CategoriesFilter = () => {
    const [categoriesFilter, setCategoriesFilter] = useAtom(categoryFilterAtom)

    const { data, isLoading, isError } = useGetAllCategories()
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            selected: [],
        },
    })

    const { watch, setValue } = form
    const selected = watch('selected') // live tracking

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

    if (isLoading) return <div>....Loading</div>
    if (isError) return <div>Error</div>

    return (
        <Form {...form}>
            <h3 className='font-semibold text-[13px] mb-3'>Danh mục sản phẩm</h3>
            <form className="">
                <FormField
                    control={form.control}
                    name="selected"
                    render={() => (
                        <FormItem>
                            <div className="space-y-2 grid grid-cols-2 gap-2">
                                {data.data.map((option: Category) => (
                                    <FormControl key={option.id}>
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
                                    </FormControl>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}

export default CategoriesFilter