'use client'
import { Calendar, DollarSign, Home, Inbox, ListCheck, Search, Settings, User, Utensils } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import Image from "next/image"
import { useState } from "react"

// Menu items.
const items = [
    {
        title: "Trang chủ",
        url: "#",
        icon: Home,
        id: 1
    },
    {
        title: "Thực đơn",
        url: "#",
        icon: Utensils,
        id: 2
    },
    {
        title: "Màn hình thu ngân",
        url: "#",
        icon: DollarSign,
        id: 3
    },
    {
        title: "Danh sách đơn hàng",
        url: "#",
        icon: ListCheck,
        id: 4
    },
    {
        title: "Báo cáo cuối ngày",
        url: "#",
        icon: Calendar,
        id: 5
    },
    {
        title: "Người dùng",
        url: "#",
        icon: User,
        id: 6
    },
]

export function AppSidebar() {
    const [currentPage, setCurrentPage] = useState(1)

    const SetCurrentItem = (item) => {
        setCurrentPage(item.id)
    }
    return (
        <Sidebar className="">
            <SidebarContent>
                <SidebarGroup className="px-2">
                    <SidebarGroupLabel className="h-[100px] flex flex-row justify-center">
                        <Image
                            src="/logo2.png"
                            width={100}
                            height={50}
                            alt="Picture of the author"
                            className="object-cover w-2/4"
                        />
                    </SidebarGroupLabel>
                    <h2 className="uppercase font-semibold text-sm pb-4 pl-2 text-gray-400">Quản lý</h2>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => {
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton onClick={() => SetCurrentItem(item)} asChild className={`hover:bg-[#ffeee1] py-5 px-4 ${currentPage === item.id ? 'bg-[#ffeee1] text-orange-500' : ''}`}>
                                            {/* 👇 Apply `group` HERE instead of on the SidebarMenuButton */}
                                            <a href={item.url} className="flex flex-row gap-3 text-sm items-center group">
                                                {/* 👇 Only this item's children respond to its hover */}
                                                <item.icon className="text-gray-600  transition-colors" />
                                                <span className="text-gray-600  transition-colors">
                                                    {item.title}
                                                </span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
