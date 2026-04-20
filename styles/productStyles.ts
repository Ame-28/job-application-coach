import React from "react";

export const palette = {
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

export const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: palette.bg,
    color: palette.text,
    fontFamily:
      "'Satoshi', 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },

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

  formWrapper: {
    maxWidth: 720,
    margin: "0 auto",
    padding: "40px 24px 80px",
  },

  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20,
    marginBottom: 20,
  },
  rowFull: {
    marginBottom: 20,
  },

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

export const focusProps = {
  onFocus: (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = palette.borderFocus;
    (e.target as HTMLElement).style.boxShadow = `0 0 0 3px ${palette.accentGlow}`;
  },
  onBlur: (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = palette.border;
    (e.target as HTMLElement).style.boxShadow = "none";
  },
};
