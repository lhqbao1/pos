import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Star } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from '@/components/ui/label'
import { useAtom } from 'jotai'
import { ratingFilterAtom } from '@/lib/atom/dishes/dish'


const formSchema = z.object({
    selected: z.array(z.string()).min(1, { message: 'Choose at least one item' }),
})

const Rating = () => {
    const [ratingFilter, setRatingFilter] = useAtom(ratingFilterAtom)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            selected: [],
        },
    })

    const handleCheckboxChange = (value: string) => {
        setRatingFilter(value)
    }

    return (
        <Form {...form}>
            <h3 className='font-semibold text-[13px] mb-3'>Đánh giá</h3>
            <form className="">
                <FormField
                    control={form.control}
                    name="selected"
                    render={() => (
                        <FormItem>
                            <div className="space-y-2">
                                <RadioGroup
                                    onValueChange={handleCheckboxChange}
                                    className="flex flex-col space-y-1 w-full"
                                >
                                    {[5, 4, 3, 2, 1].map((count) => (
                                        <div key={count} className='flex flex-row gap-2'>
                                            <RadioGroupItem value={count.toString()} id={count.toString()} />
                                            <Label htmlFor={count.toString()}>
                                                <div className='flex flex-row gap-1'>
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            fill={i < count ? 'yellow' : 'none'}
                                                            stroke='gray'
                                                            size={14}
                                                        />
                                                    ))}
                                                </div>
                                            </Label>
                                        </div>
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

export default Rating