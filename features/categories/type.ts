import { StrapiImage } from "@/lib/type/starpi-image";

export interface Category {
  id: number;
  documentId?: string;
  name: string;
  slug?: string;
  description?: string;
  image?: StrapiImage;
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface CategoryPayload {
  name: string;
  slug?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}
