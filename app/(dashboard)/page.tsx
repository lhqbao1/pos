
import Analytics from '@/components/home/analytics'
import Header from '@/components/header'
import React from 'react'


const Page = () => {
    return (
        <div className='w-full h-full px-8 py-4'>
            <Header page='Trang chủ' />
            <div className='mt-6'>
                <Analytics />
            </div>
        </div>
    )
}

export default Page
