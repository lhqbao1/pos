
import Analytics from '@/components/home/analytics'
import Header from '@/components/header'
import Recommend from '@/components/home/side/recommend'
import React from 'react'


const Page = () => {
    return (
        <div className='w-full h-full px-8 py-4'>
            <Header page='Dashboard' />
            <div className='grid grid-cols-4 gap-2 mt-6'>
                <Analytics />
                {/* <Recommend /> */}
            </div>
        </div>
    )
}

export default Page