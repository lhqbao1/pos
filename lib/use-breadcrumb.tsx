'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

const useBreadcrumb = (): string[] => {
    const pathname = usePathname()

    const breadcrumb = useMemo(() => {
        if (!pathname) return ['Dashboard']

        // Split the path, remove empty strings
        const segments = pathname.split('/').filter(Boolean)

        // Capitalize first letter of each segment

        return ['Dashboard', ...segments]
    }, [pathname])

    return breadcrumb
}

export default useBreadcrumb