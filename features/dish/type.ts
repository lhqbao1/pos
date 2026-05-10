import { StrapiImage } from "@/lib/type/starpi-image";
import { Category } from "../categories/type";

export interface Dish {
    id: number,
    documentId?: string,
    name: string,
    slug?: string,
    sku?: string,
    description?: string,
    image?: StrapiImage,
    rating?: number,
    sold?: number,
    price?: number,
    vipPrice?: number,
    costPrice?: number,
    isActive?: boolean,
    sortOrder?: number,
    category?: Category,
    createdAt?: string,
    updatedAt?: string,
    publishedAt?: string
}

export interface DishPayload {
    name: string
    price: number
    vipPrice?: number
    costPrice?: number
    sku?: string
    description?: string
    rating?: number
    sold?: number
    isActive?: boolean
    sortOrder?: number
    category?: string
    image?: number | null
    slug?: string
}
