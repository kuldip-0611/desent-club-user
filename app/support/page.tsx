import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MessageCircle, Package, RotateCcw, Truck, CreditCard, Clock, ChevronDown } from 'lucide-react'
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  supportMailtoHref,
  supportWhatsAppHref,
} from '@/constants/support'

export const metadata: Metadata = {
  title: 'Help & Support — Desent Club',
  description: 'Contact Desent Club support. Get help with orders, returns, payments and more.',
  alternates: { canonical: 'https://desentclub.com/support' },
}

const faqs = [
  {
    q: 'How long does delivery take?',
    a: 'Standard delivery takes 4–7 business days across India. Express delivery (1–3 days) is available at checkout for select pin codes.',
  },
  {
    q: 'Can I return or exchange my order?',
    a: 'Yes! You can raise a return or size exchange request within 7 days of delivery directly from your order detail page. We will schedule a reverse pickup from your doorstep.',
  },
  {
    q: 'When will I get my refund?',
    a: 'Once we receive and inspect the returned item, refunds are processed within 5–7 business days back to your original payment method. COD refunds are issued via bank transfer.',
  },
  {
    q: 'My order is stuck / not moving — what do I do?',
    a: `Please allow 24 hours for tracking to update after dispatch. If your shipment hasn't moved in 3 business days, email us at ${SUPPORT_EMAIL} with your order ID.`,
  },
  {
    q: 'Can I cancel my order?',
    a: 'Orders can be cancelled before they are shipped. Go to your order page and tap "Cancel Order". Once shipped, cancellation is not possible — you can instead raise a return after delivery.',
  },
  {
    q: 'I received a wrong or damaged item — what now?',
    a: `We're sorry about that! Email us at ${SUPPORT_EMAIL} with your order ID and a photo of the item within 48 hours of delivery. We'll replace it or refund you immediately.`,
  },
  {
    q: 'How do I track my shipment?',
    a: 'Open your order detail page and tap "Track Package". You\'ll see live shipment updates with courier name and AWB number.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Currently we only ship within India. International shipping is coming soon — join our newsletter to be notified.',
  },
]

const contactCards = [
  {
    icon: Mail,
    title: 'Email Support',
    desc: 'For detailed queries, refunds, and complaints',
    action: SUPPORT_EMAIL,
    href: supportMailtoHref,
    color: 'indigo',
    note: 'We reply within 24 hours',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Chat',
    desc: 'Quick questions and order status',
    action: 'Chat on WhatsApp',
    href: supportWhatsAppHref,
    color: 'emerald',
    note: `Mon–Sat, 10 AM – 7 PM IST · ${SUPPORT_PHONE_DISPLAY}`,
  },
]

const quickLinks = [
  { icon: Package, label: 'Track my order', href: '/orders' },
  { icon: RotateCcw, label: 'Return / Exchange', href: '/orders' },
  { icon: CreditCard, label: 'Refund status', href: '/orders' },
  { icon: Truck, label: 'Shipping information', href: '#shipping' },
]

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-50">

      <section className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 px-4 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Clock size={14} /> We typically reply within 24 hours
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">How can we help?</h1>
          <p className="mt-4 text-lg text-indigo-100">
            Our support team is here to make your experience seamless. Reach out anytime.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">

        <div className="mb-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 shrink-0">
                <Icon size={17} />
              </div>
              {label}
            </Link>
          ))}
        </div>

        <section className="mb-14">
          <h2 className="mb-6 text-2xl font-black text-slate-900">Contact Us</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {contactCards.map(({ icon: Icon, title, desc, action, href, color, note }) => (
              <a
                key={title}
                href={href}
                target={href.startsWith('mailto') ? undefined : '_blank'}
                rel="noopener noreferrer"
                className={`group flex flex-col gap-4 rounded-2xl border p-6 shadow-sm transition hover:shadow-md ${
                  color === 'indigo'
                    ? 'border-indigo-100 bg-white hover:border-indigo-300'
                    : 'border-emerald-100 bg-white hover:border-emerald-300'
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                  color === 'indigo' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">{title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    color === 'indigo'
                      ? 'bg-indigo-600 text-white group-hover:bg-indigo-700'
                      : 'bg-emerald-500 text-white group-hover:bg-emerald-600'
                  }`}>
                    {action}
                  </span>
                  <p className="mt-2 text-xs text-slate-400">{note}</p>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-6 py-4">
            <Mail size={18} className="shrink-0 text-indigo-500" />
            <p className="text-sm text-slate-700">
              You can also directly email us at{' '}
              <a href={supportMailtoHref} className="font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-900">
                {SUPPORT_EMAIL}
              </a>
              {' '}— include your <strong>order ID</strong> for faster resolution.
            </p>
          </div>
        </section>

        <section id="faq">
          <h2 className="mb-6 text-2xl font-black text-slate-900">Frequently Asked Questions</h2>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group px-6 py-0">
                <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-sm font-semibold text-slate-800 marker:hidden list-none">
                  {q}
                  <ChevronDown size={16} className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="shipping" className="mt-14">
          <h2 className="mb-6 text-2xl font-black text-slate-900">Shipping Information</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Standard Delivery', value: '4–7 business days', note: 'Free on all orders', color: 'indigo' },
              { label: 'Express Delivery', value: '1–3 business days', note: 'Available at checkout', color: 'violet' },
              { label: 'Return Pickup', value: '2–4 business days', note: 'Free doorstep pickup', color: 'emerald' },
            ].map(({ label, value, note, color }) => (
              <div key={label} className={`rounded-2xl border p-5 ${
                color === 'indigo' ? 'border-indigo-100 bg-indigo-50'
                : color === 'violet' ? 'border-violet-100 bg-violet-50'
                : 'border-emerald-100 bg-emerald-50'
              }`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${
                  color === 'indigo' ? 'text-indigo-500'
                  : color === 'violet' ? 'text-violet-500'
                  : 'text-emerald-600'
                }`}>{label}</p>
                <p className="mt-2 text-xl font-black text-slate-900">{value}</p>
                <p className="mt-0.5 text-xs text-slate-500">{note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-10 text-center text-white">
          <h3 className="text-xl font-black">Still need help?</h3>
          <p className="mt-2 text-sm text-indigo-100">Our team is ready to assist you with anything.</p>
          <a
            href={supportMailtoHref}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow transition hover:bg-indigo-50"
          >
            <Mail size={16} />
            Email {SUPPORT_EMAIL}
          </a>
        </section>

      </div>
    </main>
  )
}
