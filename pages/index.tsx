import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

/* ───────────────────────── palette ──────────────────────── */

const palette = {
  bg: "#0a0a0f",
  surface: "#12121a",
  border: "#1e1e2e",
  text: "#e2e2ef",
  textMuted: "#8888a4",
  accent: "#6366f1",
  accentGlow: "rgba(99,102,241,.35)",
  accentHover: "#818cf8",
  white: "#ffffff",
  gradientStart: "#6366f1",
  gradientEnd: "#a855f7",
  success: "#34d399",
};

/* ───────────────────────── styles ───────────────────────── */

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: palette.bg,
    color: palette.text,
    fontFamily:
      "'Satoshi', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    overflowX: "hidden",
  },

  /* ── nav ──────────────────────────────────────────────── */
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    borderBottom: `1px solid ${palette.border}`,
    backdropFilter: "blur(16px)",
    backgroundColor: "rgba(10,10,15,.75)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: "-0.02em",
    color: palette.white,
    textDecoration: "none",
  },
  logoIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 8,
    background: `linear-gradient(135deg, ${palette.gradientStart}, ${palette.gradientEnd})`,
    fontSize: 16,
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 24,
  },
  navLink: {
    fontSize: 14,
    color: palette.textMuted,
    textDecoration: "none",
    fontWeight: 500,
    cursor: "pointer",
    transition: "color .2s",
  },
  navBtn: {
    padding: "8px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: palette.white,
    background: `linear-gradient(135deg, ${palette.gradientStart}, ${palette.gradientEnd})`,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    transition: "opacity .2s",
  },
  navBtnOutline: {
    padding: "8px 20px",
    fontSize: 14,
    fontWeight: 600,
    color: palette.text,
    background: "transparent",
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    cursor: "pointer",
    transition: "border-color .2s",
  },

  /* ── hero ─────────────────────────────────────────────── */
  hero: {
    position: "relative",
    textAlign: "center" as const,
    padding: "100px 24px 80px",
    overflow: "hidden",
  },
  heroBg: {
    position: "absolute" as const,
    top: "-40%",
    left: "50%",
    transform: "translateX(-50%)",
    width: 800,
    height: 800,
    borderRadius: "50%",
    background: `radial-gradient(circle, ${palette.accent}15 0%, transparent 70%)`,
    pointerEvents: "none" as const,
  },
  heroTag: {
    position: "relative" as const,
    display: "inline-block",
    padding: "6px 16px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: palette.accent,
    border: `1px solid ${palette.accent}33`,
    backgroundColor: `${palette.accent}0d`,
    marginBottom: 24,
  },
  heroTitle: {
    position: "relative" as const,
    fontSize: 56,
    fontWeight: 800,
    letterSpacing: "-0.035em",
    lineHeight: 1.1,
    color: palette.white,
    margin: "0 auto 20px",
    maxWidth: 720,
  },
  heroGradientWord: {
    background: `linear-gradient(135deg, ${palette.gradientStart}, ${palette.gradientEnd})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  },
  heroSub: {
    position: "relative" as const,
    fontSize: 18,
    color: palette.textMuted,
    maxWidth: 540,
    margin: "0 auto 40px",
    lineHeight: 1.65,
  },
  heroCtas: {
    position: "relative" as const,
    display: "flex",
    justifyContent: "center",
    gap: 16,
    flexWrap: "wrap" as const,
  },
  ctaPrimary: {
    padding: "14px 32px",
    fontSize: 15,
    fontWeight: 700,
    color: palette.white,
    background: `linear-gradient(135deg, ${palette.gradientStart}, ${palette.gradientEnd})`,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    boxShadow: `0 0 28px ${palette.accentGlow}`,
    transition: "opacity .2s, transform .15s",
    textDecoration: "none",
    display: "inline-block",
  },
  ctaSecondary: {
    padding: "14px 32px",
    fontSize: 15,
    fontWeight: 600,
    color: palette.text,
    background: "transparent",
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    cursor: "pointer",
    transition: "border-color .2s",
    textDecoration: "none",
    display: "inline-block",
  },

  /* ── social proof bar ─────────────────────────────────── */
  proofBar: {
    display: "flex",
    justifyContent: "center",
    gap: 40,
    padding: "32px 24px",
    borderTop: `1px solid ${palette.border}`,
    borderBottom: `1px solid ${palette.border}`,
  },
  proofItem: {
    textAlign: "center" as const,
  },
  proofNum: {
    fontSize: 28,
    fontWeight: 800,
    color: palette.white,
    letterSpacing: "-0.02em",
  },
  proofLabel: {
    fontSize: 13,
    color: palette.textMuted,
    marginTop: 4,
  },

  /* ── features ─────────────────────────────────────────── */
  features: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "80px 24px",
  },
  featuresTitle: {
    textAlign: "center" as const,
    fontSize: 32,
    fontWeight: 800,
    color: palette.white,
    letterSpacing: "-0.03em",
    marginBottom: 12,
  },
  featuresSub: {
    textAlign: "center" as const,
    fontSize: 15,
    color: palette.textMuted,
    maxWidth: 480,
    margin: "0 auto 48px",
    lineHeight: 1.6,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 24,
  },
  featureCard: {
    padding: "28px 24px",
    backgroundColor: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 14,
    transition: "border-color .25s, transform .25s",
    cursor: "default",
  },
  featureIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 10,
    background: `${palette.accent}15`,
    fontSize: 20,
    marginBottom: 16,
  },
  featureHeading: {
    fontSize: 16,
    fontWeight: 700,
    color: palette.white,
    marginBottom: 8,
    letterSpacing: "-0.01em",
  },
  featureText: {
    fontSize: 14,
    color: palette.textMuted,
    lineHeight: 1.65,
  },

  /* ── how it works ─────────────────────────────────────── */
  howSection: {
    padding: "80px 24px",
    borderTop: `1px solid ${palette.border}`,
    borderBottom: `1px solid ${palette.border}`,
  },
  howTitle: {
    textAlign: "center" as const,
    fontSize: 32,
    fontWeight: 800,
    color: palette.white,
    letterSpacing: "-0.03em",
    marginBottom: 48,
  },
  howSteps: {
    display: "flex",
    justifyContent: "center",
    gap: 32,
    maxWidth: 900,
    margin: "0 auto",
  },
  howStep: {
    flex: 1,
    textAlign: "center" as const,
    padding: "0 12px",
  },
  howNum: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 10,
    background: `linear-gradient(135deg, ${palette.gradientStart}, ${palette.gradientEnd})`,
    color: palette.white,
    fontWeight: 800,
    fontSize: 16,
    marginBottom: 16,
  },
  howStepTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: palette.white,
    marginBottom: 8,
  },
  howStepText: {
    fontSize: 14,
    color: palette.textMuted,
    lineHeight: 1.6,
  },

  /* ── pricing ──────────────────────────────────────────── */
  pricing: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "80px 24px",
    textAlign: "center" as const,
  },
  pricingTitle: {
    fontSize: 32,
    fontWeight: 800,
    color: palette.white,
    letterSpacing: "-0.03em",
    marginBottom: 12,
  },
  pricingSub: {
    fontSize: 15,
    color: palette.textMuted,
    marginBottom: 48,
    lineHeight: 1.6,
  },
  pricingCards: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 24,
    maxWidth: 640,
    margin: "0 auto",
  },
  priceCard: {
    padding: "32px 28px",
    backgroundColor: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 14,
    textAlign: "left" as const,
  },
  priceCardPro: {
    padding: "32px 28px",
    backgroundColor: palette.surface,
    border: `1px solid ${palette.accent}55`,
    borderRadius: 14,
    textAlign: "left" as const,
    position: "relative" as const,
    boxShadow: `0 0 40px ${palette.accent}15`,
  },
  pricePopular: {
    position: "absolute" as const,
    top: -12,
    right: 20,
    padding: "4px 14px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    color: palette.white,
    background: `linear-gradient(135deg, ${palette.gradientStart}, ${palette.gradientEnd})`,
  },
  priceName: {
    fontSize: 16,
    fontWeight: 700,
    color: palette.white,
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: 800,
    color: palette.white,
    letterSpacing: "-0.03em",
    marginBottom: 4,
  },
  pricePeriod: {
    fontSize: 14,
    color: palette.textMuted,
    marginBottom: 20,
  },
  priceFeature: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    color: palette.textMuted,
    marginBottom: 10,
    lineHeight: 1.5,
  },
  priceCheck: {
    color: palette.success,
    fontSize: 16,
    flexShrink: 0,
  },
  priceCta: {
    display: "block",
    width: "100%",
    marginTop: 24,
    padding: "12px 0",
    fontSize: 14,
    fontWeight: 700,
    color: palette.white,
    background: `linear-gradient(135deg, ${palette.gradientStart}, ${palette.gradientEnd})`,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "center" as const,
    textDecoration: "none",
    boxSizing: "border-box" as const,
  },
  priceCtaOutline: {
    display: "block",
    width: "100%",
    marginTop: 24,
    padding: "12px 0",
    fontSize: 14,
    fontWeight: 600,
    color: palette.text,
    background: "transparent",
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    cursor: "pointer",
    textAlign: "center" as const,
    textDecoration: "none",
    boxSizing: "border-box" as const,
  },

  /* ── footer ───────────────────────────────────────────── */
  footer: {
    padding: "32px 32px",
    borderTop: `1px solid ${palette.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    color: palette.textMuted,
  },
};

/* ────────────────────────── data ─────────────────────────── */

const features = [
  {
    icon: "📝",
    title: "ATS‑Optimized Bullets",
    text: "Your resume is rewritten with exact keywords from the job posting so it passes every automated screening system.",
  },
  {
    icon: "✉️",
    title: "Personalized Cover Letters",
    text: "Each cover letter references the specific company and role, connecting your experience directly to their requirements.",
  },
  {
    icon: "🎤",
    title: "Interview Preparation",
    text: "Get predicted questions with STAR‑method frameworks built from your actual experience — not generic advice.",
  },
  {
    icon: "⚡",
    title: "Ready in Seconds",
    text: "What normally takes 60+ minutes per application is done in under 2 minutes with AI‑powered analysis.",
  },
  {
    icon: "🔒",
    title: "Private & Secure",
    text: "Your resume and data are processed securely and never stored beyond your session. Enterprise‑grade encryption throughout.",
  },
  {
    icon: "🎯",
    title: "Domain Aware",
    text: "Whether you're in tech, healthcare, finance, or education — the AI adapts its language to your target industry.",
  },
];

const steps = [
  {
    num: "1",
    title: "Paste Your Resume",
    text: "Copy and paste the content of your current resume into the form.",
  },
  {
    num: "2",
    title: "Add the Job Posting",
    text: "Paste the job description you're applying to so the AI knows the target.",
  },
  {
    num: "3",
    title: "Get Tailored Materials",
    text: "Receive optimized bullet points, a cover letter, and interview prep instantly.",
  },
];

/* ───────────────────────── component ────────────────────── */

export default function LandingPage() {
  const { isSignedIn } = useUser();

  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        html { scroll-behavior: smooth; }
        ::selection { background: ${palette.accent}55; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      {/* ── nav ──────────────────────────────── */}
      <nav style={s.nav}>
        <Link href="/" style={s.logo}>
          <span style={s.logoIcon}>🎯</span>
          JobCoach AI
        </Link>
        <div style={s.navLinks}>
          <a href="#features" style={s.navLink}>
            Features
          </a>
          <a href="#how" style={s.navLink}>
            How It Works
          </a>
          <a href="#pricing" style={s.navLink}>
            Pricing
          </a>
          {isSignedIn ? (
            <UserButton showName={true} />
          ) : (
            <>
              <SignInButton mode="modal">
                <button style={s.navBtnOutline}>Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button style={s.navBtn}>Get Started</button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      {/* ── hero ─────────────────────────────── */}
      <section style={s.hero}>
        <div style={s.heroBg} />
        <span style={s.heroTag}>AI‑Powered Career Coaching</span>
        <h1 style={s.heroTitle}>
          Turn Job Listings Into Interviews{" "}
          <span style={s.heroGradientWord}>In Minutes, Not Hours</span>
        </h1>
        <p style={s.heroSub}>
          Paste a job description and your resume. Get a tailored cover letter,
          ATS‑optimized bullet points, and interview preparation — instantly
          powered by AI.
        </p>
        <div style={s.heroCtas}>
          <Link href="/product" style={s.ctaPrimary}>
            Start Coaching — Free
          </Link>
          <a href="#how" style={s.ctaSecondary}>
            See How It Works
          </a>
        </div>
      </section>

      {/* ── social proof ─────────────────────── */}
      <section style={s.proofBar}>
        <div style={s.proofItem}>
          <div style={s.proofNum}>2 min</div>
          <div style={s.proofLabel}>Average generation time</div>
        </div>
        <div style={s.proofItem}>
          <div style={s.proofNum}>3</div>
          <div style={s.proofLabel}>Tailored output sections</div>
        </div>
        <div style={s.proofItem}>
          <div style={s.proofNum}>8+</div>
          <div style={s.proofLabel}>Industries supported</div>
        </div>
        <div style={s.proofItem}>
          <div style={s.proofNum}>100%</div>
          <div style={s.proofLabel}>Based on your real experience</div>
        </div>
      </section>

      {/* ── features ─────────────────────────── */}
      <section id="features" style={s.features}>
        <h2 style={s.featuresTitle}>Everything You Need to Apply</h2>
        <p style={s.featuresSub}>
          Each tool is designed around real hiring processes — from ATS
          screening to the final interview round.
        </p>
        <div style={s.featureGrid}>
          {features.map((f, i) => (
            <div
              key={i}
              style={s.featureCard}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  palette.accent + "55";
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  palette.border;
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
              }}
            >
              <div style={s.featureIcon}>{f.icon}</div>
              <div style={s.featureHeading}>{f.title}</div>
              <div style={s.featureText}>{f.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── how it works ─────────────────────── */}
      <section id="how" style={s.howSection}>
        <h2 style={s.howTitle}>How It Works</h2>
        <div style={s.howSteps}>
          {steps.map((st, i) => (
            <div key={i} style={s.howStep}>
              <div style={s.howNum}>{st.num}</div>
              <div style={s.howStepTitle}>{st.title}</div>
              <div style={s.howStepText}>{st.text}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── pricing ──────────────────────────── */}
      <section id="pricing" style={s.pricing}>
        <h2 style={s.pricingTitle}>Simple, Transparent Pricing</h2>
        <p style={s.pricingSub}>
          Start for free. Upgrade when you need unlimited coaching sessions.
        </p>
        <div style={s.pricingCards}>
          {/* free */}
          <div style={s.priceCard}>
            <div style={s.priceName}>Free</div>
            <div style={s.priceAmount}>$0</div>
            <div style={s.pricePeriod}>No credit card required</div>
            {[
              "Browse the landing page",
              "See sample AI output",
              "Preview all features",
            ].map((f, i) => (
              <div key={i} style={s.priceFeature}>
                <span style={s.priceCheck}>✓</span> {f}
              </div>
            ))}
            <Link href="/product" style={s.priceCtaOutline}>
              Try Free
            </Link>
          </div>

          {/* premium */}
          <div style={s.priceCardPro}>
            <span style={s.pricePopular}>Most Popular</span>
            <div style={s.priceName}>Premium</div>
            <div style={s.priceAmount}>$9</div>
            <div style={s.pricePeriod}>per month</div>
            {[
              "Unlimited AI coaching sessions",
              "ATS‑optimized resume bullets",
              "Tailored cover letter drafts",
              "Interview prep with STAR method",
              "Conversation history saved",
            ].map((f, i) => (
              <div key={i} style={s.priceFeature}>
                <span style={s.priceCheck}>✓</span> {f}
              </div>
            ))}
            <Link href="/product" style={s.priceCta}>
              Get Premium
            </Link>
          </div>
        </div>
      </section>

      {/* ── footer ───────────────────────────── */}
      <footer style={s.footer}>
        <div style={s.logo}>
          <span style={s.logoIcon}>🎯</span>
          JobCoach AI
        </div>
        <div>© {new Date().getFullYear()} JobCoach AI. Built for AIE1018.</div>
      </footer>
    </div>
  );
}
