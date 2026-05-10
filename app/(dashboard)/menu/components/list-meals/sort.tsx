import * as React from "react"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAtom } from "jotai"
import { sortFilterAtom } from "@/lib/atom/dishes/dish"
import { ArrowUpDown } from "lucide-react"

export function Sort() {
    const [sortFilter, setSortFilter] = useAtom(sortFilterAtom)
    const selectedSort = sortFilter || "createdAt:desc"

    return (
        <Select onValueChange={(value: string) => setSortFilter(value)} value={selectedSort}>
            <SelectTrigger className="h-11 min-w-[190px] rounded-2xl border-[#e4d1ba] bg-white px-3 text-sm font-medium text-[#6e4b2d] shadow-sm focus-visible:ring-[#e6c59f]/50">
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-[#9b7b5b]" />
                    <SelectValue placeholder="Sắp xếp" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectGroup >
                    <SelectItem value="createdAt:desc">Mới nhất</SelectItem>
                    <SelectItem value="price:asc">Thấp tới cao</SelectItem>
                    <SelectItem value="price:desc">Cao tới thấp</SelectItem>
                    <SelectItem value="rating:desc">Đánh giá</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}
