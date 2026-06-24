import Link from 'next/link'

export const metadata = { title: 'Terms of Service — Disent Club' }

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/home" className="mb-8 inline-block text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">
        ← Back to home
      </Link>

      <h1 className="mb-2 text-3xl font-black">Terms of Service</h1>
      <p className="mb-10 text-sm text-slate-500">Last updated: June 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p>By accessing or using the Disent Club website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">2. Use of Services</h2>
          <p>You may use our services only for lawful purposes and in accordance with these terms. You agree not to use the services in any way that violates applicable local, national, or international law or regulation.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">3. Account Registration</h2>
          <p>To access certain features you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorised use.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">4. Orders & Payments</h2>
          <p>All orders are subject to product availability. We reserve the right to refuse or cancel any order. Prices are listed in Indian Rupees (₹) and are subject to change without notice. Payment must be received before we dispatch your order.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">5. Shipping & Delivery</h2>
          <p>Estimated delivery times are provided in good faith but are not guaranteed. Disent Club is not liable for delays caused by courier partners, customs, or other factors beyond our control.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">6. Returns & Refunds</h2>
          <p>We accept returns within 7 days of delivery for unused, unwashed items in original packaging. Refunds are processed within 5–7 business days after we receive and inspect the returned item. Shipping charges are non-refundable.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">7. Intellectual Property</h2>
          <p>All content on this website — including text, graphics, logos, and images — is the property of Disent Club and is protected by applicable intellectual property laws. You may not reproduce or distribute any content without our prior written permission.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Disent Club shall not be liable for any indirect, incidental, special, or consequential damages arising out of your use of or inability to use our services.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">9. Changes to Terms</h2>
          <p>We reserve the right to update these terms at any time. Continued use of our services after changes are posted constitutes your acceptance of the revised terms.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">10. Contact Us</h2>
          <p>For questions about these terms, email us at <a href="mailto:support@disentclub.com" className="font-medium text-slate-900 underline dark:text-white">support@disentclub.com</a>.</p>
        </section>
      </div>
    </main>
  )
}
