const digitsOnly = (value: string) => value.replace(/\D/g, '')

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@desentclub.com'

export const SUPPORT_PHONE =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '919313597171'

export const SUPPORT_PHONE_DISPLAY =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY ?? '+91 93135 97171'

export const SUPPORT_WHATSAPP_MESSAGE =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_MESSAGE ??
  'Hi, I need help with my Desent Club order.'

export const supportMailtoHref = `mailto:${SUPPORT_EMAIL}`

export const supportWhatsAppHref = `https://wa.me/${digitsOnly(SUPPORT_PHONE)}?text=${encodeURIComponent(SUPPORT_WHATSAPP_MESSAGE)}`

export const supportTelHref = `tel:+${digitsOnly(SUPPORT_PHONE)}`
