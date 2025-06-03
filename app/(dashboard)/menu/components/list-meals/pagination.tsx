import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { pageAtom } from "@/lib/atom/dishes/dish"
import { useAtom } from "jotai"

interface PaginationProps {
    currentPage: number,
    pageSize: number,
    pageCount: number
}

export function PaginationSection({ currentPage, pageCount }: PaginationProps) {
    const [page, setPage] = useAtom(pageAtom)

    const handlePrevious = () => {
        if (page === 1) {
            return
        } else if (page > 1) {
            setPage(page - 1)
        }
    }
    const handleNext = () => {
        if (page === pageCount) {
            return
        } else {
            setPage(page + 1)
        }
    }
    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious onClick={handlePrevious} className="cursor-pointer" />
                </PaginationItem>
                {Array.from({ length: pageCount }, (_, i) => (
                    <PaginationItem key={i}>
                        <PaginationLink onClick={() => setPage(i + 1)} isActive={i + 1 === currentPage ? true : false}>
                            {i + 1}
                        </PaginationLink>
                    </PaginationItem>
                ))}
                <PaginationItem>
                    <PaginationNext onClick={handleNext} className="cursor-pointer" />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}
