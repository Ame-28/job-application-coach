import { useState } from "react";
import { useAuth, UserButton, useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import { palette, styles, focusProps } from "../styles/productStyles";

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

    try {
      const response = await fetch(
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
            years_experience: parseInt(String(yearsExperience)) || 0,
            target_industry: targetIndustry,
          }),
        }
      );
      const data = await response.json();
      setOutput(data.response ?? JSON.stringify(data));
    } catch (error) {
      console.error("Error:", error);
      setOutput("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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
