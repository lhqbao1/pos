'use client'
import React, { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import {
    Form,
    FormField,
    FormItem,
    FormControl,
    FormMessage,
} from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useAtom } from 'jotai'
import { priceFilterAtom } from '@/lib/atom/dishes/dish'
import { CircleX } from 'lucide-react'

const formSchema = z.object({
    selected: z.array(z.string()).min(1, { message: 'Choose at least one item' }),
})

const options = [
    { id: '1', label: '0 - 50.000đ' },
    { id: '2', label: '50.000đ - 100.000đ' },
    { id: '3', label: '100.000đ - 200.000đ' },
    { id: '4', label: '200.000đ - 500.000đ' },
    { id: '5', label: '500.000đ - 1.000.000đ' },
    { id: '6', label: 'Không lọc' },
]

const PriceRange = () => {
    const [priceFilter, setPriceFilter] = useAtom(priceFilterAtom)
    const [selectedValue, setSelectedValue] = useState('');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            selected: [],
        },
    })

    const handleCheckboxChange = (value: string) => {
        let priceRange = []
        if (value === 'Không lọc') {
            priceRange = [0, 0]
        } else {
            priceRange = value
                .split(' - ')                             // ["100.000đ", "200.000đ"]
                .map(str =>
                    parseInt(str.replace(/\D/g, ''))       // Remove all non-digit characters, then convert to number
                );
        }
        setPriceFilter(priceRange)
    }

    return (
        <Form {...form}>
            <div className='flex flex-row justify-between items-center mb-3'>
                <h3 className='font-semibold text-[13px]'>Giá bán</h3>
                <CircleX
                    size={14}
                    onClick={() => {
                        setSelectedValue('');     // unselect radio
                        setPriceFilter([]);       // reset atom value too
                    }}
                />
            </div>
            <form className="">
                <FormField
                    control={form.control}
                    name="selected"
                    render={() => (
                        <FormItem>
                            <div className="space-y-2">
                                <RadioGroup
                                    onValueChange={(value) => {
                                        setSelectedValue(value); // update local state
                                        handleCheckboxChange(value); // update atom or external state
                                    }}
                                    className="flex flex-col space-y-1 w-full">
                                    {options.map((option) => (
                                        <FormControl key={option.id}>
                                            <div className="flex items-center space-x-2">
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value={option.label} id={option.id} />
                                                    <Label htmlFor="1">{option.label}</Label>
                                                </div>
                                            </div>
                                        </FormControl>
                                    ))}
                                </RadioGroup>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
    )
}

export default PriceRange