import { apiClient } from '@/services/api/client'
import type { AddressFormValues, UserAddress } from '@/types/address'

export const listMyAddresses = async (): Promise<UserAddress[]> => {
  const { data } = await apiClient.get<UserAddress[]>('/users/me/addresses')
  return data
}

export const createMyAddress = async (
  payload: AddressFormValues,
): Promise<UserAddress> => {
  const { data } = await apiClient.post<UserAddress>('/users/me/addresses', payload)
  return data
}

export const updateMyAddress = async (
  id: string,
  payload: Partial<AddressFormValues>,
): Promise<UserAddress> => {
  const { data } = await apiClient.patch<UserAddress>(`/users/me/addresses/${id}`, payload)
  return data
}

export const deleteMyAddress = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/me/addresses/${id}`)
}

export const setDefaultMyAddress = async (id: string): Promise<UserAddress> => {
  const { data } = await apiClient.patch<UserAddress>(`/users/me/addresses/${id}/default`)
  return data
}
