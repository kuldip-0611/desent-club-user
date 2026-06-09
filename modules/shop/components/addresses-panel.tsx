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
  }

  const startEdit = (address: UserAddress) => {
    setEditingId(address.id)
    setForm(addressToForm(address))
    setShowForm(true)
  }

  const startNew = () => {
    setEditingId(null)
    setForm({
      ...emptyAddressForm(),
      isDefault: addresses.length === 0,
    })
    setShowForm(true)
  }

  const updateField = (key: keyof AddressFormValues, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.phone.trim() || !form.line1.trim()) {
      toast.error('Name, phone, and address line are required')
      return
    }
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this address?')) return
    try {
      await deleteMyAddress(id)
      if (selectedAddressId === id) {
        setSelectedAddressId(null)
      }
      toast.success('Address removed')
      await loadAddresses()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete address')
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
                    ? 'border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-200'
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
                      className="text-xs font-medium text-indigo-600 hover:underline"
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
                      className="text-xs font-medium text-indigo-600 hover:underline"
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
                    onClick={() => void handleDelete(address.id)}
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

      {showForm ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">
            {editingId ? 'Edit address' : 'New address'}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder="Label (Home, Office)"
              value={form.label}
              onChange={(e) => updateField('label', e.target.value)}
            />
            <Input
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
            <Input
              placeholder="Pincode"
              value={form.pincode}
              onChange={(e) => updateField('pincode', e.target.value)}
            />
            <Input
              placeholder="City"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
            />
            <Input
              placeholder="State"
              value={form.state}
              onChange={(e) => updateField('state', e.target.value)}
            />
            <Input
              placeholder="Country"
              value={form.country}
              onChange={(e) => updateField('country', e.target.value)}
            />
          </div>
          <Input
            placeholder="Address line 1"
            value={form.line1}
            onChange={(e) => updateField('line1', e.target.value)}
          />
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
