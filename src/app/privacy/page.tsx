import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = {
  title: "Privacy Policy - Suppertime",
  description: "Privacy policy for Suppertime meal planning app",
};

export default function PrivacyPage() {
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
          <h1>Privacy Policy for Suppertime</h1>
          <p className="text-text-muted"><strong>Last updated: January 2026</strong></p>

          <h2>Overview</h2>
          <p>
            Suppertime is a meal planning app designed to simplify family dinners. This policy
            explains what data we collect, why, and how we protect it.
          </p>

          <h2>Who We Are</h2>
          <p>
            Suppertime is operated by Andy, based in the United Kingdom.
          </p>
          <p>
            Contact: <a href="mailto:hello@suppertime.uk">hello@suppertime.uk</a>
          </p>

          <h2>Data We Collect</h2>

          <h3>Account Information</h3>
          <ul>
            <li>Email address (for login and account recovery)</li>
            <li>Name (optional, for personalisation)</li>
          </ul>

          <h3>Meal Planning Data</h3>
          <ul>
            <li>Recipes you save or create</li>
            <li>Meal plans and schedules</li>
            <li>Shopping lists</li>
            <li>Household preferences (dietary requirements, portion sizes)</li>
          </ul>

          <h3>Push Notification Data</h3>
          <ul>
            <li>Device push notification tokens (to send reminders)</li>
            <li>Notification preferences and schedules</li>
          </ul>

          <h3>Technical Data</h3>
          <ul>
            <li>Basic usage analytics (pages visited, features used)</li>
            <li>Error logs for troubleshooting</li>
            <li>Device type and browser version</li>
          </ul>

          <h2>How We Use Your Data</h2>
          <p>We use your data solely to:</p>
          <ul>
            <li>Provide the meal planning service</li>
            <li>Send you scheduled reminders and notifications you&apos;ve requested</li>
            <li>Improve the app based on usage patterns</li>
            <li>Fix bugs and technical issues</li>
          </ul>

          <p>We do <strong>not</strong>:</p>
          <ul>
            <li>Sell your data to third parties</li>
            <li>Use your data for advertising</li>
            <li>Share your recipes or meal plans with other users (unless you explicitly choose to)</li>
          </ul>

          <h2>Data Storage and Security</h2>
          <p>
            Your data is stored on Supabase servers (EU region) with encryption at rest and in
            transit. Push notification tokens are stored securely and used only for delivering
            notifications you&apos;ve requested.
          </p>

          <h2>Data Retention</h2>
          <ul>
            <li>Your account data is retained while your account is active</li>
            <li>Upon account deletion, your data is permanently removed within 30 days</li>
            <li>Anonymous usage analytics may be retained for up to 12 months</li>
          </ul>

          <h2>Your Rights (UK GDPR)</h2>
          <p>You have the right to:</p>
          <ol>
            <li><strong>Access</strong> - Request a copy of all data we hold about you</li>
            <li><strong>Rectification</strong> - Correct any inaccurate data</li>
            <li><strong>Erasure</strong> - Delete your account and all associated data</li>
            <li><strong>Portability</strong> - Export your data in a machine-readable format</li>
            <li><strong>Withdraw consent</strong> - Turn off notifications or delete your account at any time</li>
          </ol>
          <p>
            To exercise these rights, contact us at{" "}
            <a href="mailto:hello@suppertime.uk">hello@suppertime.uk</a> or use the in-app settings.
          </p>

          <h2>Children&apos;s Privacy</h2>
          <p>
            Suppertime is intended for adults managing household meal planning. We do not knowingly
            collect data from children under 13.
          </p>

          <h2>Push Notifications</h2>
          <p>We send push notifications only when:</p>
          <ul>
            <li>You explicitly enable them in the app</li>
            <li>They relate to reminders you&apos;ve scheduled (e.g., &quot;Did everyone eat?&quot;)</li>
          </ul>
          <p>
            You can disable notifications at any time through your device settings or within the app.
          </p>

          <h2>Third-Party Services</h2>
          <p>We use:</p>
          <ul>
            <li><strong>Supabase</strong> - Database and authentication (EU servers)</li>
            <li><strong>Web Push Protocol</strong> - For browser notifications (no third-party service, self-hosted)</li>
          </ul>

          <h2>Changes to This Policy</h2>
          <p>
            We&apos;ll notify you of significant changes via email or in-app notification. Continued use
            after changes constitutes acceptance.
          </p>

          <h2>Contact</h2>
          <p>
            Questions or requests? Email us at{" "}
            <a href="mailto:hello@suppertime.uk">hello@suppertime.uk</a>.
          </p>

          <hr />
          <p className="text-sm text-text-muted">
            <em>
              This policy complies with the UK General Data Protection Regulation (UK GDPR) and the
              Data Protection Act 2018.
            </em>
          </p>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-surface px-6 py-8 border-t border-border">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <span>&copy; 2025</span>
            <Link href="/terms" className="hover:text-text-secondary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-text-secondary font-medium text-text-primary">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
