import React from 'react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from 'next/link'

interface BreadCrumb {
    pages?: string[]
}

const BreadCrumb = ({ pages }: BreadCrumb) => {
    const listPages = pages
    if (listPages && listPages?.length > 0) {
        listPages.map((item: string, index: number) => {
            if (item === 'Dashboard') {
                listPages[index] = 'Trang chủ'
            }
            if (item === "menu") {
                listPages[index] = "Thực đơn"
            }
            if (item === "cashier") {
                listPages[index] = "Thu ngân"
            }
            if (item === "orders") {
                listPages[index] = "Đơn hàng"
            }
        })
    }
    return (
        <Breadcrumb>
            <BreadcrumbList className='gap-0 sm:gap-0'>
                {pages && pages?.length > 0 ?
                    pages.map((item: string, index: number) => {
                        return (
                            <div key={index} className='flex flex-row items-center'>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link className={`capitalize text-xs ${index === 0 ? 'text-secondary font-semibold' : ''}`} href="/">{item}</Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                {index === pages.length - 1 ? '' : <BreadcrumbSeparator />}
                            </div>
                        )
                    })
                    : ''}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export default BreadCrumb