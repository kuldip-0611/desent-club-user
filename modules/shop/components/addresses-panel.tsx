'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createMyAddress,
  deleteMyAddress,
  listMyAddresses,
  setDefaultMyAddress,
  updateMyAddress,
} from '@/services/address.service'
import { useCheckoutAddressStore } from '@/store/checkout-address-store'
import {
  addressToForm,
  emptyAddressForm,
  formatAddressLine,
  type AddressFormValues,
  type UserAddress,
} from '@/types/address'

type AddressesPanelProps = {
  mode: 'profile' | 'checkout'
  onRequireAuth?: () => void
  isAuthenticated?: boolean
}

export const AddressesPanel = ({
  mode,
  onRequireAuth,
  isAuthenticated = true,
}: AddressesPanelProps) => {
  const selectedAddressId = useCheckoutAddressStore((s) => s.selectedAddressId)
  const setSelectedAddressId = useCheckoutAddressStore((s) => s.setSelectedAddressId)

  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AddressFormValues>(emptyAddressForm())
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AddressFormValues, string>>>({})

  const loadAddresses = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const rows = await listMyAddresses()
      setAddresses(rows)
      if (mode === 'checkout') {
        const defaultRow = rows.find((r) => r.isDefault) ?? rows[0]
        if (defaultRow && !selectedAddressId) {
          setSelectedAddressId(defaultRow.id)
        } else if (
          selectedAddressId &&
          !rows.some((r) => r.id === selectedAddressId)
        ) {
          setSelectedAddressId(defaultRow?.id ?? null)
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load addresses')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, mode, selectedAddressId, setSelectedAddressId])

  useEffect(() => {
    void loadAddresses()
  }, [loadAddresses])

  const selectedAddress = useMemo(
    () => addresses.find((a) => a.id === selectedAddressId) ?? null,
    [addresses, selectedAddressId],
  )

  const resetForm = () => {
    setForm(emptyAddressForm())
    setEditingId(null)
    setShowForm(false)
    setFormErrors({})
  }

  const validatePhone = (val: string) => {
    const digits = val.replace(/\D/g, '')
    if (!digits) return 'Phone number is required'
    if (digits.length !== 10) return 'Enter a valid 10-digit mobile number'
    if (!/^[6-9]/.test(digits)) return 'Mobile number must start with 6, 7, 8 or 9'
    return ''
  }

  const validatePincode = (val: string) => {
    const digits = val.replace(/\D/g, '')
    if (!digits) return 'Pincode is required'
    if (digits.length !== 6) return 'Pincode must be 6 digits'
    if (/^0/.test(digits)) return 'Enter a valid Indian pincode'
    return ''
  }

  const validateForm = () => {
    const errors: Partial<Record<keyof AddressFormValues, string>> = {}
    if (!form.fullName.trim()) errors.fullName = 'Full name is required'
    const phoneErr = validatePhone(form.phone)
    if (phoneErr) errors.phone = phoneErr
    if (!form.line1.trim()) errors.line1 = 'Address line 1 is required'
    if (!form.city.trim()) errors.city = 'City is required'
    if (!form.state.trim()) errors.state = 'State is required'
    const pincodeErr = validatePincode(form.pincode)
    if (pincodeErr) errors.pincode = pincodeErr
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const startEdit = (address: UserAddress) => {
    setEditingId(address.id)
    setForm(addressToForm(address))
    setFormErrors({})
    setShowForm(true)
  }

  const startNew = () => {
    setEditingId(null)
    setForm({
      ...emptyAddressForm(),
      isDefault: addresses.length === 0,
    })
    setFormErrors({})
    setShowForm(true)
  }

  const updateField = (key: keyof AddressFormValues, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (formErrors[key]) setFormErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateMyAddress(editingId, form)
        toast.success('Address updated')
      } else {
        const created = await createMyAddress(form)
        toast.success('Address saved')
        if (mode === 'checkout') {
          setSelectedAddressId(created.id)
        }
      }
      resetForm()
      await loadAddresses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save address')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    setDeleting(true)
    try {
      await deleteMyAddress(deleteConfirmId)
      if (selectedAddressId === deleteConfirmId) {
        setSelectedAddressId(null)
      }
      toast.success('Address removed')
      setDeleteConfirmId(null)
      await loadAddresses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete address')
    } finally {
      setDeleting(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultMyAddress(id)
      if (mode === 'checkout') {
        setSelectedAddressId(id)
      }
      toast.success('Default address updated')
      await loadAddresses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update default')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
        Sign in to save and reuse delivery addresses.
        {onRequireAuth ? (
          <Button className="mt-3" size="sm" onClick={onRequireAuth}>
            Sign in
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className={mode === 'profile' ? 'text-lg font-semibold' : 'text-base font-semibold'}>
          {mode === 'checkout' ? 'Delivery address' : 'Saved addresses'}
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={startNew}>
          Add address
        </Button>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading addresses…</p> : null}

      {!loading && addresses.length > 0 ? (
        <div className="space-y-2">
          {addresses.map((address) => {
            const isSelected =
              mode === 'checkout' ? selectedAddressId === address.id : address.isDefault
            return (
              <div
                key={address.id}
                className={`rounded-xl border p-3 transition ${
                  isSelected
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-300'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  {mode === 'checkout' ? (
                    <input
                      type="radio"
                      name="checkout-address"
                      checked={selectedAddressId === address.id}
                      onChange={() => setSelectedAddressId(address.id)}
                      className="mt-1"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{address.fullName}</p>
                      {address.label ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          {address.label}
                        </span>
                      ) : null}
                      {address.isDefault ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{address.phone}</p>
                    <p className="mt-1 text-sm text-slate-700">{formatAddressLine(address)}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {mode === 'checkout' ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-slate-700 hover:underline"
                      onClick={() => {
                        setSelectedAddressId(address.id)
                        startEdit(address)
                      }}
                    >
                      Edit
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="text-xs font-medium text-slate-700 hover:underline"
                      onClick={() => startEdit(address)}
                    >
                      Edit
                    </button>
                  )}
                  {!address.isDefault ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-slate-600 hover:underline"
                      onClick={() => void handleSetDefault(address.id)}
                    >
                      Set default
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="text-xs font-medium text-rose-600 hover:underline"
                    onClick={() => setDeleteConfirmId(address.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {!loading && addresses.length === 0 && !showForm ? (
        <p className="text-sm text-slate-500">No saved addresses yet. Add one for faster checkout.</p>
      ) : null}

      {mode === 'checkout' && selectedAddress && !showForm ? (
        <p className="text-xs text-slate-500">
          Delivering to: <span className="font-medium text-slate-700">{selectedAddress.fullName}</span>
          {' · '}
          {selectedAddress.pincode}
        </p>
      ) : null}

      {deleteConfirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100">
              <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">Delete address?</h3>
            <p className="mt-1 text-sm text-slate-500">This address will be permanently removed and cannot be recovered.</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {editingId ? 'Edit address' : 'New address'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Input
                placeholder="Label (Home, Office)"
                value={form.label}
                onChange={(e) => updateField('label', e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="Full name *"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className={formErrors.fullName ? 'border-rose-500 focus-visible:ring-rose-400' : ''}
              />
              {formErrors.fullName && (
                <p className="mt-1 text-[11px] text-rose-600">{formErrors.fullName}</p>
              )}
            </div>
            <div>
              <Input
                placeholder="Mobile number *"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                  updateField('phone', digits)
                }}
                onBlur={() => {
                  const err = validatePhone(form.phone)
                  if (err) setFormErrors((prev) => ({ ...prev, phone: err }))
                }}
                className={formErrors.phone ? 'border-rose-500 focus-visible:ring-rose-400' : ''}
              />
              {formErrors.phone ? (
                <p className="mt-1 text-[11px] text-rose-600">{formErrors.phone}</p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-400">10-digit Indian mobile number</p>
              )}
            </div>
            <div>
              <Input
                placeholder="Pincode *"
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
                  updateField('pincode', digits)
                }}
                onBlur={() => {
                  const err = validatePincode(form.pincode)
                  if (err) setFormErrors((prev) => ({ ...prev, pincode: err }))
                }}
                className={formErrors.pincode ? 'border-rose-500 focus-visible:ring-rose-400' : ''}
              />
              {formErrors.pincode ? (
                <p className="mt-1 text-[11px] text-rose-600">{formErrors.pincode}</p>
              ) : (
                <p className="mt-1 text-[10px] text-slate-400">6-digit Indian pincode</p>
              )}
            </div>
            <div>
              <Input
                placeholder="City *"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                className={formErrors.city ? 'border-rose-500 focus-visible:ring-rose-400' : ''}
              />
              {formErrors.city && (
                <p className="mt-1 text-[11px] text-rose-600">{formErrors.city}</p>
              )}
            </div>
            <div>
              <Input
                placeholder="State *"
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                className={formErrors.state ? 'border-rose-500 focus-visible:ring-rose-400' : ''}
              />
              {formErrors.state && (
                <p className="mt-1 text-[11px] text-rose-600">{formErrors.state}</p>
              )}
            </div>
            <div>
              <Input
                placeholder="Country"
                value={form.country}
                onChange={(e) => updateField('country', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Input
              placeholder="Address line 1 *"
              value={form.line1}
              onChange={(e) => updateField('line1', e.target.value)}
              className={formErrors.line1 ? 'border-rose-500 focus-visible:ring-rose-400' : ''}
            />
            {formErrors.line1 && (
              <p className="mt-1 text-[11px] text-rose-600">{formErrors.line1}</p>
            )}
          </div>
          <Input
            placeholder="Address line 2 (optional)"
            value={form.line2}
            onChange={(e) => updateField('line2', e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => updateField('isDefault', e.target.checked)}
            />
            Set as default address
          </label>
          <div className="flex gap-2">
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? 'Saving…' : editingId ? 'Update address' : 'Save address'}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
