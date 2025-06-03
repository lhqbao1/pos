import { StrapiImage } from "@/lib/type/starpi-image";

export interface Category {
  id: number;
  name: string;
  image: StrapiImage;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}
