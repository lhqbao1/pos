import React from 'react'
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
import Image from 'next/image'
import { DollarSign, PackageCheck, Star } from 'lucide-react'
import { Dish } from '@/features/dish/type'

type MealsListProps = {
    data: Dish
}

const MealCart = ({ data }: MealsListProps) => {
    const imageUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    return (
        <Card className='border-0 shadow-none p-3 gap-3'>
            <CardContent className='p-0'>
                <Image
                    src={data.image ? `${imageUrl}${data.image.url}` : '/placeholder-image.jpg'}
                    width={300}
                    height={300}
                    alt="Picture of the author"
                    className='w-full h-[150px] object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform duration-200'
                />
            </CardContent>
            <CardFooter className='p-0 flex-col items-start'>
                <h2 className='text-sm font-bold line-clamp-2'>{data.name}</h2>
                <p className='text-xs text-zinc-500'>{data.category ? data.category.name : 'Unknown Category'}</p>
                <div className='flex flex-row justify-between mt-3 w-full'>
                    <div className='flex flex-row gap-2 items-center'>
                        <div className='flex flex-row gap-1 text-sm items-center'>
                            <Star size={14} fill='yellow' stroke='gray' />
                            <p>{data.rating}</p>
                        </div>
                        <div className='flex flex-row gap-1 text-sm items-center'>
                            <PackageCheck size={14} />
                            <p>{data.sold}</p>
                        </div>
                    </div>
                    <div className='flex flex-row text-sm font-semibold text-secondary items-center'>
                        <DollarSign size={16} />
                        <p>{data.price ? data.price.toLocaleString("de-DE") : ''}</p>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}

export default MealCart