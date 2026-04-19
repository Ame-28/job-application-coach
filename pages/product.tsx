import { useState } from "react";
import { useAuth, UserButton, useUser } from "@clerk/nextjs";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import ReactMarkdown from "react-markdown";

/* ───────────────────────── styles ───────────────────────── */

const palette = {
  bg: "#0a0a0f",
  surface: "#12121a",
  surfaceHover: "#1a1a26",
  border: "#1e1e2e",
  borderFocus: "#6366f1",
  text: "#e2e2ef",
  textMuted: "#8888a4",
  accent: "#6366f1",
  accentGlow: "rgba(99,102,241,.35)",
  accentHover: "#818cf8",
  white: "#ffffff",
  outputBg: "#0f0f18",
  success: "#34d399",
  dangerMuted: "#f87171",
  gradientStart: "#6366f1",
  gradientEnd: "#a855f7",
};

const styles: Record<string, React.CSSProperties> = {
  /* ── page ─────────────────────────────────────────────── */
  page: {
    minHeight: "100vh",
    backgroundColor: palette.bg,
    color: palette.text,
    fontFamily:
      "'Satoshi', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },

  /* ── top bar ──────────────────────────────────────────── */
  topBar: {
    position: "sticky" as const,
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

  /* ── hero strip ───────────────────────────────────────── */
  hero: {
    textAlign: "center" as const,
    padding: "48px 24px 32px",
    borderBottom: `1px solid ${palette.border}`,
  },
  heroTag: {
    display: "inline-block",
    padding: "4px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: palette.accent,
    border: `1px solid ${palette.accent}33`,
    backgroundColor: `${palette.accent}0d`,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    lineHeight: 1.2,
    color: palette.white,
    margin: "0 0 12px",
  },
  heroSub: {
    fontSize: 15,
    color: palette.textMuted,
    maxWidth: 520,
    margin: "0 auto",
    lineHeight: 1.6,
  },

  /* ── form wrapper ─────────────────────────────────────── */
  formWrapper: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "40px 24px 80px",
  },

  /* ── field rows ───────────────────────────────────────── */
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 20,
  },
  rowFull: {
    marginBottom: 20,
  },

  /* ── label ────────────────────────────────────────────── */
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: palette.textMuted,
    marginBottom: 8,
    letterSpacing: "0.02em",
  },
  required: {
    color: palette.dangerMuted,
    marginLeft: 2,
  },

  /* ── inputs ───────────────────────────────────────────── */
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: 14,
    color: palette.text,
    backgroundColor: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    outline: "none",
    transition: "border-color .2s, box-shadow .2s",
    boxSizing: "border-box" as const,
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    fontSize: 14,
    color: palette.text,
    backgroundColor: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    outline: "none",
    appearance: "none" as const,
    backgroundImage:
      'url("data:image/svg+xml,%3Csvg width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1.5L6 6.5L11 1.5\' stroke=\'%238888a4\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")',
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 16px center",
    cursor: "pointer",
    boxSizing: "border-box" as const,
  },
  textarea: {
    width: "100%",
    padding: "14px 16px",
    fontSize: 14,
    color: palette.text,
    backgroundColor: palette.surface,
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    outline: "none",
    resize: "vertical" as const,
    minHeight: 140,
    lineHeight: 1.6,
    transition: "border-color .2s, box-shadow .2s",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
  },

  /* ── button ───────────────────────────────────────────── */
  button: {
    width: "100%",
    padding: "14px 24px",
    fontSize: 15,
    fontWeight: 700,
    color: palette.white,
    background: `linear-gradient(135deg, ${palette.gradientStart}, ${palette.gradientEnd})`,
    border: "none",
    borderRadius: 12,
    cursor: "pointer",
    letterSpacing: "-0.01em",
    transition: "opacity .2s, transform .15s, box-shadow .2s",
    boxShadow: `0 0 24px ${palette.accentGlow}`,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
    boxShadow: "none",
  },

  /* ── output card ──────────────────────────────────────── */
  outputWrapper: {
    marginTop: 40,
  },
  outputLabel: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    color: palette.textMuted,
    marginBottom: 12,
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
  },
  outputDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: palette.success,
    animation: "pulse 2s ease-in-out infinite",
  },
  outputCard: {
    padding: "28px 28px 32px",
    backgroundColor: palette.outputBg,
    border: `1px solid ${palette.border}`,
    borderRadius: 14,
    lineHeight: 1.75,
    fontSize: 14,
    overflowX: "auto" as const,
  },

  /* ── paywall fallback ─────────────────────────────────── */
  paywall: {
    maxWidth: 480,
    margin: "120px auto",
    textAlign: "center" as const,
    padding: "0 24px",
  },
  paywallIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 56,
    height: 56,
    borderRadius: 14,
    background: `linear-gradient(135deg, ${palette.gradientStart}22, ${palette.gradientEnd}22)`,
    fontSize: 26,
    marginBottom: 20,
  },
  paywallTitle: {
    fontSize: 24,
    fontWeight: 700,
    color: palette.white,
    marginBottom: 12,
  },
  paywallText: {
    fontSize: 15,
    color: palette.textMuted,
    lineHeight: 1.6,
    marginBottom: 28,
  },
};

/* ── focus helper (JS‑driven since inline styles can't do :focus) ── */
const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = palette.borderFocus;
    (e.target as HTMLElement).style.boxShadow = `0 0 0 3px ${palette.accentGlow}`;
  },
  onBlur: (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = palette.border;
    (e.target as HTMLElement).style.boxShadow = "none";
  },
};

/* ──────────────────────── component ─────────────────────── */

export default function ProductPage() {
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [targetIndustry, setTargetIndustry] = useState("Technology");
  const [emailAddress, setEmailAddress] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const { getToken } = useAuth();
  const { user } = useUser();
  const isPremium = user?.publicMetadata?.premium === true;

  const canSubmit =
    jobTitle.trim() !== "" &&
    companyName.trim() !== "" &&
    jobDescription.trim().length >= 50 &&
    resumeText.trim().length >= 50 &&
    emailAddress.includes("@") &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setOutput("");
    const token = await getToken();

    await fetchEventSource(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/api`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_title: jobTitle,
          company_name: companyName,
          job_description: jobDescription,
          resume_text: resumeText,
          years_experience: yearsExperience,
          target_industry: targetIndustry,
          email_address: emailAddress,
        }),
        onmessage(ev) {
          if (ev.data) {
            setOutput((prev) => prev + ev.data);
          } else {
            setOutput((prev) => prev + "\n");
          }
        },
        onerror(err) {
          console.error("SSE error:", err);
          setLoading(false);
        },
        onclose() {
          setLoading(false);
        },
      }
    );
  };

  /* ─────────── render ─────────── */
  return (
    <div style={styles.page}>
      {/* inject the pulse animation */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .35; }
        }
        ::selection { background: ${palette.accent}55; }
        /* markdown inside the output card */
        .output-md h2 {
          font-size: 18px;
          font-weight: 700;
          color: ${palette.white};
          margin: 28px 0 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid ${palette.border};
        }
        .output-md h2:first-child { margin-top: 0; }
        .output-md p  { margin: 0 0 12px; }
        .output-md ul { padding-left: 20px; margin: 0 0 12px; }
        .output-md li { margin-bottom: 6px; }
        .output-md strong { color: ${palette.white}; }
      `}</style>

      {/* ── top bar ────────────────────────────── */}
      <header style={styles.topBar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🎯</span>
          JobCoach AI
        </div>
        <UserButton showName={true} />
      </header>

      {!isPremium ? (
        <div style={styles.paywall}>
          <div style={styles.paywallIcon}>🔒</div>
          <h2 style={styles.paywallTitle}>Upgrade to Premium</h2>
          <p style={styles.paywallText}>
            Get unlimited access to AI‑powered resume tailoring, cover letter
            drafts, and interview preparation — all personalized to every job
            you apply for.
          </p>
        </div>
      ) : (
        <>
        {/* ── hero strip ──────────────────────── */}
        <section style={styles.hero}>
          <span style={styles.heroTag}>AI‑Powered</span>
          <h1 style={styles.heroTitle}>Job Application Coach</h1>
          <p style={styles.heroSub}>
            Paste a job description and your resume — get ATS‑optimized bullet
            points, a tailored cover letter, and interview prep in seconds.
          </p>
        </section>

        {/* ── form ────────────────────────────── */}
        <div style={styles.formWrapper}>
          {/* row 1 — job title + company */}
          <div style={styles.row}>
            <div>
              <label style={styles.label}>
                Job Title <span style={styles.required}>*</span>
              </label>
              <input
                style={styles.input}
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                {...focusProps}
              />
            </div>
            <div>
              <label style={styles.label}>
                Company Name <span style={styles.required}>*</span>
              </label>
              <input
                style={styles.input}
                placeholder="e.g., Google"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                {...focusProps}
              />
            </div>
          </div>

          {/* row 2 — industry + years + email */}
          <div style={{ ...styles.row, gridTemplateColumns: "1fr 1fr 1fr" }}>
            <div>
              <label style={styles.label}>
                Industry <span style={styles.required}>*</span>
              </label>
              <select
                style={styles.select}
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                {...focusProps}
              >
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Government">Government</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>
                Experience <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                style={styles.input}
                value={yearsExperience}
                onChange={(e) =>
                  setYearsExperience(parseInt(e.target.value) || 0)
                }
                min={0}
                max={50}
                {...focusProps}
              />
            </div>
            <div>
              <label style={styles.label}>
                Email <span style={styles.required}>*</span>
              </label>
              <input
                type="email"
                style={styles.input}
                placeholder="you@example.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                {...focusProps}
              />
            </div>
          </div>

          {/* row 3 — job description */}
          <div style={styles.rowFull}>
            <label style={styles.label}>
              Job Description <span style={styles.required}>*</span>
            </label>
            <textarea
              style={styles.textarea}
              placeholder="Paste the full job posting here…"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              {...focusProps}
            />
          </div>

          {/* row 4 — resume */}
          <div style={styles.rowFull}>
            <label style={styles.label}>
              Your Resume <span style={styles.required}>*</span>
            </label>
            <textarea
              style={styles.textarea}
              placeholder="Paste your current resume content here…"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              {...focusProps}
            />
          </div>

          {/* submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              ...styles.button,
              ...(!canSubmit ? styles.buttonDisabled : {}),
            }}
            onMouseEnter={(e) => {
              if (canSubmit) {
                (e.target as HTMLElement).style.opacity = "0.9";
                (e.target as HTMLElement).style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.opacity = "1";
              (e.target as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            {loading ? "✨ Generating…" : "Generate Application Materials"}
          </button>

          {/* ── output ────────────────────────── */}
          {(output || loading) && (
            <div style={styles.outputWrapper}>
              <div style={styles.outputLabel}>
                {loading && <span style={styles.outputDot} />}
                {loading ? "Generating response…" : "Your results"}
              </div>
              <div style={styles.outputCard} className="output-md">
                {output ? (
                  <ReactMarkdown>{output}</ReactMarkdown>
                ) : (
                  <span style={{ color: palette.textMuted }}>
                    Waiting for AI response…
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        </>
      )}
    </div>
  );
}
