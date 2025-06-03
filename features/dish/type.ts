import { StrapiImage } from "@/lib/type/starpi-image";
import { Category } from "../categories/type";

export interface Dish {
    id: number,
    name: string,
    image?: StrapiImage,
    rating?: number,
    sold?: number,
    price?: number,
    vipPrice?: number,
    category?: Category,
    documentId?: string,
    createdAt: string,
    updatedAt: string,
    publishedAt: string
}