import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — Disent Club' }

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/home" className="mb-8 inline-block text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white">
        ← Back to home
      </Link>

      <h1 className="mb-2 text-3xl font-black">Privacy Policy</h1>
      <p className="mb-10 text-sm text-slate-500">Last updated: June 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">1. Information We Collect</h2>
          <p>We collect information you provide directly — such as your name, email address, phone number, shipping address, and payment details — when you create an account, place an order, or contact us. We also collect usage data such as pages visited and device information.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">2. How We Use Your Information</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Process and fulfil your orders</li>
            <li>Send order confirmations, shipping updates, and receipts</li>
            <li>Respond to customer support enquiries</li>
            <li>Send promotional communications (with your consent)</li>
            <li>Improve and personalise our services</li>
            <li>Prevent fraud and ensure security</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">3. Push Notifications</h2>
          <p>If you grant permission, we may send you browser push notifications about orders, offers, and updates. You can revoke this permission at any time via your browser settings.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">4. Sharing Your Information</h2>
          <p>We do not sell your personal data. We share it only with trusted third parties who help us operate our business — such as payment processors, courier partners, and cloud infrastructure providers — and only to the extent necessary to provide our services.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">5. Cookies</h2>
          <p>We use cookies and similar technologies to keep you signed in, remember your cart, and analyse site usage. You can control cookie preferences through your browser, though disabling certain cookies may affect site functionality.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">6. Data Retention</h2>
          <p>We retain your personal data for as long as your account is active or as needed to provide services and comply with legal obligations. You may request deletion of your data at any time by contacting us.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">7. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. To exercise these rights, email us at <a href="mailto:support@disentclub.com" className="font-medium text-slate-900 underline dark:text-white">support@disentclub.com</a>.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">8. Security</h2>
          <p>We implement industry-standard security measures including HTTPS encryption and access controls to protect your information. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">9. Changes to This Policy</h2>
          <p>We may update this policy from time to time. We will notify you of significant changes via email or a notice on our website. Continued use of our services after changes are posted constitutes acceptance.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">10. Contact Us</h2>
          <p>For privacy-related questions, email us at <a href="mailto:support@disentclub.com" className="font-medium text-slate-900 underline dark:text-white">support@disentclub.com</a>.</p>
        </section>
      </div>
    </main>
  )
}
