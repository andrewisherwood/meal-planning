import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Logo size="sm" />
        <Link
          href="/login"
          className="px-4 py-2 rounded-full bg-brand-primary text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Start planning
        </Link>
      </header>

      {/* Hero */}
      <section className="bg-brand-bg px-6 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            Dinner is decided.
          </h1>
          <p className="text-lg md:text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            Suppertime is a calm meal planner for families. Plan the week, sync it to your calendar, and stop thinking about what&apos;s for dinner.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 rounded-full bg-brand-primary text-white font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Start planning — it&apos;s free
          </Link>
        </div>

        {/* Hero visual */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-lg border border-border">
            <Image
              src="/homepage-design-assets/screenshot_weekly_plan_grid.png"
              alt="Suppertime weekly meal planner"
              width={1200}
              height={675}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="bg-white px-6 py-16 md:py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
            The 4pm question
          </h2>
          <div className="space-y-4 text-text-secondary text-lg leading-relaxed">
            <p>
              Every parent knows it. That moment when you realise nobody has thought about dinner — and now you have to.
            </p>
            <p>
              It&apos;s not just cooking. It&apos;s deciding. Again. While everything else is still happening.
            </p>
            <p>
              Suppertime closes that loop earlier in the week, so by 4pm the answer already exists.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-brand-accent px-6 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-12 text-center">
            A week at a glance
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Beat 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-center mb-4 py-6">
                <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="12" width="48" height="44" rx="6" fill="#f8ebe4"/>
                  <rect x="8" y="12" width="48" height="12" rx="6" fill="#d4846a"/>
                  <rect x="8" y="18" width="48" height="6" fill="#d4846a"/>
                  <line x1="24" y1="24" x2="24" y2="56" stroke="#e8d5cd" strokeWidth="1"/>
                  <line x1="40" y1="24" x2="40" y2="56" stroke="#e8d5cd" strokeWidth="1"/>
                  <line x1="8" y1="38" x2="56" y2="38" stroke="#e8d5cd" strokeWidth="1"/>
                  <rect x="12" y="28" width="9" height="7" rx="2" fill="#b8d4a8"/>
                  <rect x="27" y="28" width="9" height="7" rx="2" fill="#f4a574"/>
                  <rect x="43" y="42" width="9" height="7" rx="2" fill="#a8c8d4"/>
                  <rect x="12" y="42" width="9" height="7" rx="2" fill="#dda8c4"/>
                  <circle cx="50" cy="32" r="6" fill="#d4846a"/>
                  <path d="M50 29 L50 35 M47 32 L53 32" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Plan together
              </h3>
              <p className="text-text-secondary">
                Drag meals onto the week. Kids can help choose — fewer surprises, fewer &quot;no&quot;s.
              </p>
            </div>

            {/* Beat 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-center mb-4 py-6">
                <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
                  <rect x="10" y="14" width="36" height="36" rx="6" fill="#f8ebe4"/>
                  <rect x="10" y="14" width="36" height="10" rx="6" fill="#d4846a"/>
                  <rect x="10" y="20" width="36" height="4" fill="#d4846a"/>
                  <rect x="18" y="10" width="4" height="8" rx="2" fill="#d4846a"/>
                  <rect x="34" y="10" width="4" height="8" rx="2" fill="#d4846a"/>
                  <rect x="14" y="28" width="14" height="6" rx="2" fill="#f4a574"/>
                  <rect x="14" y="38" width="10" height="6" rx="2" fill="#b8d4a8"/>
                  <circle cx="48" cy="40" r="12" fill="#d4846a"/>
                  <path d="M44 40 L48 36 L52 40 M48 36 L48 46" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Sync to your calendar
              </h3>
              <p className="text-text-secondary">
                Meals appear alongside everything else. The decision is finished.
              </p>
            </div>

            {/* Beat 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-center mb-4 py-6">
                <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
                  <rect x="12" y="20" width="40" height="28" rx="6" fill="#f8ebe4" stroke="#d4846a" strokeWidth="2"/>
                  <rect x="10" y="16" width="44" height="8" rx="4" fill="#d4846a"/>
                  <ellipse cx="24" cy="34" rx="6" ry="4" fill="#b8d4a8"/>
                  <ellipse cx="38" cy="36" rx="5" ry="3" fill="#f4a574"/>
                  <ellipse cx="30" cy="40" rx="4" ry="3" fill="#a8c8d4"/>
                  <path d="M46 50 Q 54 50 54 42 Q 54 34 46 34" stroke="#d4846a" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <path d="M48 31 L46 34 L49 36" stroke="#d4846a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Leftovers count
              </h3>
              <p className="text-text-secondary">
                Yesterday&apos;s effort becomes tomorrow&apos;s lunch. No extra thinking required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Feeling */}
      <section className="bg-white px-6 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
            Good enough is good enough
          </h2>
          <div className="space-y-4 text-text-secondary text-lg leading-relaxed mb-8">
            <p>
              Some nights are ambitious. Some nights are beans on toast.
            </p>
            <p>
              Both of them count.
            </p>
            <p>
              Suppertime doesn&apos;t score your meals or track your streaks. It just helps you decide once, so you can stop deciding.
            </p>
          </div>

          <p className="text-text-secondary text-lg mb-6">
            At the end of the day, there&apos;s one question:
          </p>

          {/* Checkbox UI element */}
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-brand-bg rounded-2xl border border-border">
            <div className="w-6 h-6 rounded-md bg-brand-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-lg font-medium text-text-primary">Everyone ate.</span>
          </div>

          <p className="mt-6 text-text-secondary text-lg font-medium">
            That&apos;s enough.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-bg px-6 py-16 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Ready to stop thinking about dinner?
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            Suppertime is free while we&apos;re in beta. Sign up with just your email — no password needed.
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-4 rounded-full bg-brand-primary text-white font-semibold text-lg hover:opacity-90 transition-opacity mb-4"
          >
            Start planning
          </Link>
          <p className="text-text-muted text-sm">
            Questions? Feedback?{" "}
            <a href="mailto:hello@suppertime.uk" className="underline hover:text-text-secondary">
              hello@suppertime.uk
            </a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white px-6 py-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <span>&copy; 2025</span>
            <Link href="/terms" className="hover:text-text-secondary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-text-secondary">
              Privacy
            </Link>
            <a href="mailto:hello@suppertime.uk" className="hover:text-text-secondary">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
