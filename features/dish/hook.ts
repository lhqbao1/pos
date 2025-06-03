// features/meals/hooks/useMealsQuery.ts
import { useQuery } from '@tanstack/react-query'
import { getDishes, getDishesByCategory } from './services'

interface DishesQueryParams {
  page?: number;
  pageSize?: number;
  minPrice?: number;
  maxPrice?: number;
  category?: string[];
  search?: string;
  sort?: string;
  [key: string]: any; // allows additional custom filters
}

export const useDishesQuery = (params?: DishesQueryParams) => {
   const filters: Record<string, any> = {};

    if (params?.minPrice) filters['filters[price][$gte]'] = params.minPrice;
    if (params?.maxPrice) filters['filters[price][$lte]'] = params.maxPrice;
    if(params?.category) {
        params?.category?.map((item,index) =>{ 
            filters[`filters[category][name][$in][${index}]`] = item;
        })
    }
    if(params?.search) filters['filters[name][$containsi]'] = params.search
    if(params?.sort) filters['sort'] = params.sort
    if(params?.page) filters['pagination[page]'] = params.page;
    if(params?.pageSize) filters['pagination[pageSize]'] = params.pageSize;

    const filter: Record<string, any> = {
    'populate': '*',
    ...filters
    };


    return useQuery({
        queryKey: ['dish', filter],
        queryFn: () => getDishes(filter)
    })
}

export const useGetDishesByCategory = (category?: string) => {
    const filters: Record<string, string | number> = {}

    if (category) filters['filters[category][name][$eq]'] = category;

    const filter: Record<string, any> = {
        'populate[0]': 'category',
        'populate[1]': 'image',
        ...filters
    }
    

    return useQuery({
        queryKey: ['dishes', category],
        queryFn: () => getDishesByCategory(filter),
        enabled: !!category,
    })
}

