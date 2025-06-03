import { atom } from 'jotai'

export const pageSizeAtom = atom(15)
export const pageAtom = atom(1)
export const pageCountAtom = atom(1)
export const categoryFilterAtom = atom<string[]>([])
export const priceFilterAtom = atom<number[]>([])
export const ratingFilterAtom = atom()
export const searchFilterAtom = atom('')
export const sortFilterAtom = atom('createdAt:desc')