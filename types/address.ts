export type UserAddress = {
  id: string
  userId: string
  label: string | null
  fullName: string
  phone: string
  line1: string
  line2: string | null
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type AddressFormValues = {
  label: string
  fullName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
}

export const emptyAddressForm = (): AddressFormValues => ({
  label: '',
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  isDefault: false,
})

export const addressToForm = (address: UserAddress): AddressFormValues => ({
  label: address.label ?? '',
  fullName: address.fullName,
  phone: address.phone,
  line1: address.line1,
  line2: address.line2 ?? '',
  city: address.city,
  state: address.state,
  pincode: address.pincode,
  country: address.country,
  isDefault: address.isDefault,
})

export const formatAddressLine = (address: UserAddress): string => {
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ].filter(Boolean)
  return parts.join(', ')
}
