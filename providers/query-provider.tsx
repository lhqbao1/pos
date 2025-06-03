// providers/query-provider.tsx
'use client'

import { queryClient } from '@/lib/query-client'
import { QueryClientProvider, Hydrate } from '@tanstack/react-query'

export function QueryProvider({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <Hydrate state={null}>
                {children}
            </Hydrate>
        </QueryClientProvider>
    )
}
