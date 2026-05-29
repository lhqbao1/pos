import { MediaImage } from "@/lib/type/media-image";

export interface Category {
  id: number;
  documentId?: string;
  name: string;
  slug?: string;
  description?: string;
  image?: Partial<MediaImage> & { url: string };
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
