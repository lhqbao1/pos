'use client'
import React from 'react'
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAtom } from 'jotai'
import { searchFilterAtom } from '@/lib/atom/dishes/dish'
import { Search } from 'lucide-react'

const formSchema = z.object({
    searchData: z.string().min(0),
})

const SearchForm = () => {
    const [, setSearchFilter] = useAtom(searchFilterAtom)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            searchData: "",
        },
    })

    function onSubmit(data: z.infer<typeof formSchema>) {
        setSearchFilter(data.searchData)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full">
                <FormField
                    control={form.control}
                    name="searchData"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className='relative w-full min-w-[240px]'>
                                    <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a7a59]' />
                                    <Input
                                        placeholder="Tìm món ăn"
                                        className='h-11 w-full rounded-2xl border-[#e5d4bf] bg-white/95 pl-10 pr-12 text-sm font-medium shadow-sm placeholder:text-[#8d7256] focus-visible:ring-[#e6c59f]/50'
                                        {...field}
                                    />
                                    <button
                                        className='absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90'
                                        type='submit'
                                        aria-label='Tìm kiếm món ăn'
                                    >
                                        <Search className='h-4 w-4' />
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}

export default SearchForm
