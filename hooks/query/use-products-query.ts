'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import {
  getProductBySlug,
  getShopHome,
  listProducts,
  listRelatedProducts,
  listShopCategories,
} from '@/services'
import type { ProductFilters } from '@/types/product'

export const useProductsQuery = (filters: ProductFilters) =>
  useQuery({
    queryKey: ['products', filters],
    queryFn: () => listProducts(filters),
  })

export const useInfiniteProductsQuery = (filters: Omit<ProductFilters, 'page'>) =>
  useInfiniteQuery({
    queryKey: ['products-infinite', filters],
    queryFn: ({ pageParam }) => listProducts({ ...filters, page: Number(pageParam), limit: 8 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasNextPage && last.items.length > 0 ? last.page + 1 : undefined),
  })

export const useProductQuery = (slug: string) =>
  useQuery({
    queryKey: ['product', slug],
    queryFn: () => getProductBySlug(slug),
  })

export const useRelatedProductsQuery = (productId?: string) =>
  useQuery({
    queryKey: ['related-products', productId],
    enabled: Boolean(productId),
    queryFn: () => listRelatedProducts(productId!),
  })

export const useShopCategoriesQuery = () =>
  useQuery({
    queryKey: ['shop-categories'],
    queryFn: listShopCategories,
  })

export const useShopHomeQuery = () =>
  useQuery({
    queryKey: ['shop-home'],
    queryFn: getShopHome,
  })
