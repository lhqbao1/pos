import React from 'react'
import {
    Card,
    CardContent,
    CardFooter,
} from "@/components/ui/card"
import Image from 'next/image'
import { PackageCheck, Star } from 'lucide-react'
import { Dish } from '@/features/dish/type'
import { STRAPI_BASE_URL } from '@/lib/strapi-client'
import { formattedNumber } from '@/lib/format-vnd'

type MealsListProps = {
    data: Dish
    actions?: React.ReactNode
}

const MealCart = ({ data, actions }: MealsListProps) => {
    const imageUrl = data.image?.url
        ? data.image.url.startsWith('http')
            ? data.image.url
            : `${STRAPI_BASE_URL}${data.image.url}`
        : '/placeholder-image.jpg'

    return (
        <Card className='group gap-3 overflow-hidden rounded-2xl border border-[#efe1d1] bg-white/95 p-3 shadow-[0_8px_20px_rgba(149,103,61,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(149,103,61,0.16)]'>
            <CardContent className='relative p-0'>
                <Image
                    src={imageUrl}
                    width={300}
                    height={300}
                    alt={data.name}
                    className='h-[170px] w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105'
                />
                {data.category?.name ? (
                    <span className='absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur'>
                        {data.category.name}
                    </span>
                ) : null}
                {actions ? <div className='absolute right-2 top-2'>{actions}</div> : null}
            </CardContent>
            <CardFooter className='flex flex-col items-start gap-3 p-0'>
                <div className='w-full'>
                    <h2 className='line-clamp-2 text-base font-bold leading-tight text-[#2f1f13]'>{data.name}</h2>
                    <p className='mt-1 text-xs text-[#8f755c]'>{data.category?.name ?? 'Chưa phân loại'}</p>
                </div>

                <div className='flex w-full items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <div className='inline-flex items-center gap-1 rounded-full bg-[#fff4e6] px-2.5 py-1 text-xs font-semibold text-secondary'>
                            <Star className='h-3.5 w-3.5 fill-current text-secondary stroke-secondary' />
                            <p>{data.rating ?? 0}</p>
                        </div>
                        <div className='inline-flex items-center gap-1 rounded-full bg-[#f3f1ee] px-2.5 py-1 text-xs font-semibold text-[#5e5a56]'>
                            <PackageCheck className='h-3.5 w-3.5' />
                            <p>{data.sold ?? 0}</p>
                        </div>
                    </div>
                    <div className='text-right'>
                        <p className='text-xs uppercase tracking-wide text-[#a07f62]'>Giá bán</p>
                        <p className='text-lg font-bold text-secondary'>{data.price ? formattedNumber(data.price) : '0 VND'}</p>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}

export default MealCart
