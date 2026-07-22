"use client"

import { usePathname, useSearchParams } from "next/navigation"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./ui/pagination"

const ListPagination = ({
  currentPage,
  totalPages,
  maxVisiblePages = 5,
  pageParamsName = "page",
}: {
  currentPage: number
  totalPages: number
  maxVisiblePages?: number
  pageParamsName?: string
}) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const getHref = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(pageParamsName, page.toString())
    return `${pathname}?${params.toString()}`
  }

  const getPageRange = () => {
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const end = Math.min(totalPages, start + maxVisiblePages - 1)

    if (end === totalPages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const pageRange = getPageRange()

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={getHref(currentPage - 1)}
            disabled={currentPage === 1}
            className="hover:bg-brand/10"
            size={"default"}
          />
        </PaginationItem>

        {!pageRange.includes(1) && (
          <>
            <PaginationItem>
              <PaginationLink
                href={getHref(1)}
                className={
                  currentPage === 1 ? "bg-brand text-brand-secondary pointer-events-none" : "hover:bg-brand/10"
                }
                size={"default"}
              >
                1
              </PaginationLink>
            </PaginationItem>
            {pageRange[0] > 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
          </>
        )}

        {pageRange.map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href={getHref(page)}
              className={
                page === currentPage ? "bg-brand text-brand-secondary pointer-events-none" : "hover:bg-brand/10"
              }
              size={"default"}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}

        {!pageRange.includes(totalPages) && (
          <>
            {pageRange[pageRange.length - 1] < totalPages - 1 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationLink
                href={getHref(totalPages)}
                className={
                  currentPage === totalPages ? "bg-brand text-brand-secondary pointer-events-none" : "hover:bg-brand/10"
                }
                size={"default"}
              >
                {totalPages}
              </PaginationLink>
            </PaginationItem>
          </>
        )}

        <PaginationItem>
          <PaginationNext
            href={getHref(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="hover:bg-brand/10"
            size={"default"}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default ListPagination
