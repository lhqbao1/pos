
import Analytics from '@/components/home/analytics'
import Header from '@/components/home/header'
import Recommend from '@/components/home/recommend'
import React from 'react'


const Page = () => {
    return (
        <div className='bg-[#fff3e6] w-full h-full px-8 py-4'>
            <Header />
            <div className='grid grid-cols-4 gap-8'>
                <Analytics />
                <Recommend />
            </div>
        </div>
    )
}

export default Page