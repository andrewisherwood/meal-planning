import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Terms of Service - Suppertime",
  description: "Terms of service for Suppertime meal planning app",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto border-b border-border">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 rounded-full bg-brand-primary text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Start planning
        </Link>
      </header>

      {/* Content */}
      <main className="px-6 py-12 max-w-3xl mx-auto">
        <article className="prose prose-slate max-w-none">
          <h1>Terms of Service for Suppertime</h1>
          <p className="text-text-muted"><strong>Last updated: January 2026</strong></p>

          <h2>1. Agreement</h2>
          <p>
            By using Suppertime, you agree to these terms. If you don&apos;t agree, please don&apos;t use the
            app.
          </p>

          <h2>2. The Service</h2>
          <p>Suppertime is a meal planning application that helps you:</p>
          <ul>
            <li>Plan meals for your household</li>
            <li>Generate shopping lists</li>
            <li>Set reminders for meal times</li>
            <li>Track whether meals were eaten</li>
          </ul>

          <h2>3. Your Account</h2>
          <ul>
            <li>You&apos;re responsible for keeping your login credentials secure</li>
            <li>You must provide accurate information when creating an account</li>
            <li>
              One account per person (household members should be added within your account, not as
              separate accounts)
            </li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for any illegal purpose</li>
            <li>Attempt to access other users&apos; data</li>
            <li>Reverse engineer or attempt to extract source code</li>
            <li>Overload our systems with automated requests</li>
          </ul>

          <h2>5. Your Content</h2>
          <p>
            You retain ownership of any recipes, meal plans, or other content you create. By using
            the service, you grant us permission to store and process this content solely to provide
            the service to you.
          </p>

          <h2>6. Availability</h2>
          <p>
            We aim to keep Suppertime available 24/7, but we don&apos;t guarantee uninterrupted access. We
            may need to take the service offline for maintenance.
          </p>

          <h2>7. Liability</h2>
          <p>Suppertime is provided &quot;as is&quot;. We&apos;re not liable for:</p>
          <ul>
            <li>Decisions you make based on meal suggestions</li>
            <li>Dietary or health outcomes</li>
            <li>Data loss (though we back up regularly)</li>
            <li>Service interruptions</li>
          </ul>
          <p>
            Our total liability is limited to the amount you&apos;ve paid us (which, if using the free
            tier, is £0).
          </p>

          <h2>8. Changes</h2>
          <p>We may update these terms. Continued use after changes means you accept them.</p>

          <h2>9. Termination</h2>
          <p>
            You can delete your account at any time. We may terminate accounts that violate these
            terms.
          </p>

          <h2>10. Governing Law</h2>
          <p>These terms are governed by the laws of England and Wales.</p>

          <h2>11. Contact</h2>
          <p>
            Questions? Email{" "}
            <a href="mailto:hello@suppertime.uk">hello@suppertime.uk</a>.
          </p>

          <hr />
          <p className="text-sm text-text-muted italic">
            Plain English summary: Use the app sensibly, your recipes are yours, we&apos;ll do our best
            to keep things running, and we&apos;re not responsible if you burn the dinner.
          </p>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-surface px-6 py-8 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <span>&copy; 2025</span>
            <Link href="/terms" className="hover:text-text-secondary font-medium text-text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-text-secondary">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
