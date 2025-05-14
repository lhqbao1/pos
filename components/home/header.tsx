import React from 'react'
import { Input } from '../ui/input'
import { Bell, Settings } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

const Header = () => {
    return (
        <div className='dashboard-header grid grid-cols-4 gap-8 justify-center items-center'>
            <div className='flex flex-col justify-start text-start col-span-2'>
                <h2 className='text-base font-semibold'>Dashboard</h2>
                <p className='text-xs text-zinc-700'>Welcome to Dashboard</p>
            </div>
            <div className='relative'>
                <button className='absolute right-2' type='submit'>
                    <div className='p-2 rounded-full'>
                        <svg
                            className="w-5 h-5 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16.5 10.5a6 6 0 11-12 0 6 6 0 0112 0z" />
                        </svg>
                    </div>
                </button>
                <Input type='text' placeholder='Search' className='border-none rounded-lg bg-white inset-shadow-xs' />
            </div>
            <div className='flex flex-row gap-2 justify-between items-center'>
                <div className='bg-white p-2 h-[36px] w-[36px] flex items-center justify-center rounded-lg'>
                    <Bell />
                </div>
                <div className='bg-white p-2 h-[36px] w-[36px] flex items-center justify-center rounded-lg'>
                    <Settings />
                </div>
                <div className='flex flex-col'>
                    <p className='text-sm font-semibold'>Quán Thùy Linh</p>
                    <p className='text-xs text-zinc-700'>Admin</p>
                </div>
                <div>
                    <Avatar>
                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    )
}

export default Header