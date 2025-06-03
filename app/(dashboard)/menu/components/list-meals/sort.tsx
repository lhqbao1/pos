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

export function Sort() {
    const [sortFilter, setSortFilter] = useAtom(sortFilterAtom)

    return (
        <Select onValueChange={(value: string) => setSortFilter(value)} value={sortFilter}>
            <SelectTrigger className=" border-0 shadow-none active:ring-0 focus-visible:ring-0">
                <SelectValue placeholder="" />
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
