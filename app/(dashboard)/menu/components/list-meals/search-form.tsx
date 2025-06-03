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

const formSchema = z.object({
    searchData: z.string().min(0),
})

const SearchForm = () => {
    const [searchFilter, setSearchFilter] = useAtom(searchFilterAtom)

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
            <form onSubmit={form.handleSubmit(onSubmit)} // Prevent default submit
                className="space-y-8">
                <FormField
                    control={form.control}
                    name="searchData"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <div className='relative'>
                                    <Input
                                        placeholder="Tìm món ăn"
                                        className='input placeholder:uppercase placeholder:text-black placeholder:text-xs text-xs rounded-full w-[200px]'
                                        {...field}
                                    />
                                    {/* Using inset-y-0 to put the icon inside the input */}
                                    <button className='absolute inset-y-0 right-1 flex items-center cursor-pointer' type='submit'>
                                        <div className='p-1 rounded-full'>
                                            <svg
                                                className="w-5 h-5 text-black"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.5 10.5a6 6 0 11-12 0 6 6 0 0112 0z" />
                                            </svg>
                                        </div>
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