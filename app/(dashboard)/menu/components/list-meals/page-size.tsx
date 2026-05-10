"use client"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useAtom } from "jotai"
import { pageSizeAtom } from "@/lib/atom/dishes/dish"

export function PageSize() {
    const [pageSize, setPageSize] = useAtom(pageSizeAtom)
    return (

        <Select value={pageSize.toString()} onValueChange={(val) => setPageSize(Number(val))}>
            <SelectTrigger className="h-11 min-w-[88px] rounded-2xl border-[#e4d1ba] bg-white px-3 text-sm shadow-sm focus-visible:ring-[#e6c59f]/50">
                <SelectValue placeholder="Select page size" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="9">9</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="18">18</SelectItem>
                <SelectItem value="30">30</SelectItem>
            </SelectContent>
        </Select>
    )
}
