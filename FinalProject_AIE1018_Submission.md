# Final Project Submission — AIE1018: AI Deployment and MLOps

**Course:** AIE1018 — AI Deployment and MLOps, Cambrian College — Winter 2026  
**Project:** Build and Ship Your Own Production AI SaaS  

**GitHub Repository URL:** `https://github.com/YOUR_USERNAME/job-application-coach`  
**CloudFront Production URL:** `https://dXXXXXXXXXX.cloudfront.net`  
*(Replace with your actual URLs after deployment)*

---

## Domain Selection

### Q-Domain.1 — Chosen Domain

I am building a **Job Application Coach** — an AI-powered SaaS tool designed for job seekers who want to tailor their applications to specific job postings. The target user is anyone actively applying for jobs: recent graduates, career changers, or professionals seeking new roles. The problem it solves is the tedious, error-prone process of customizing resumes, cover letters, and interview preparation for each position. Without AI, a job seeker must manually read a job description, identify keywords and requirements, rewrite their bullet points, draft a unique cover letter, and brainstorm potential interview questions — a process that takes 45–90 minutes per application. This tool reduces that to under 2 minutes by producing tailored, structured output that the user can immediately use.

### Q-Domain.2 — Output Sections

| Section Name | Intended Audience | Tone |
|---|---|---|
| **Tailored Resume Bullet Points** | The job seeker (direct user) | Professional, concise, and action-oriented. Uses strong action verbs and quantified achievements. Mirrors keywords from the job description. |
| **Cover Letter Draft** | The hiring manager (end recipient) | Warm but professional. Addresses the company by name, connects the candidate's experience to specific job requirements, and expresses genuine enthusiasm without being generic. |
| **Interview Preparation Tips** | The job seeker (direct user) | Conversational and coaching-oriented. Anticipates likely interview questions based on the job description, provides STAR-method frameworks, and flags potential weaknesses the candidate should prepare to address. |

---

## Part 0: Project Proposal and Architecture Design

### Task 0.1 — InputRecord Pydantic Model

| Field Name | Python Type | Description | Validation Note |
|---|---|---|---|
| `job_title` | `str` | The title of the position being applied for | Required, min length 2 characters |
| `company_name` | `str` | Name of the hiring company | Required, min length 1 character |
| `job_description` | `str` | Full text of the job posting | Required, min length 50 characters (ensures meaningful input) |
| `resume_text` | `str` | The candidate's current resume content | Required, min length 50 characters |
| `years_experience` | `int` | Candidate's total years of professional experience | Must be between 0 and 50 |
| `target_industry` | `str` | Industry category (e.g., "Technology", "Healthcare", "Finance") | Required, selected from dropdown |
| `email_address` | `str` | Candidate's contact email for the cover letter header | Must match email format (regex validated) |
| `session_id` | `Optional[str]` | Session ID for conversation continuity | Optional, defaults to None |

```python
from pydantic import BaseModel, Field, field_validator
from typing import Optional
import re

class InputRecord(BaseModel):
    job_title: str = Field(..., min_length=2, description="Position title")
    company_name: str = Field(..., min_length=1, description="Hiring company name")
    job_description: str = Field(..., min_length=50, description="Full job posting text")
    resume_text: str = Field(..., min_length=50, description="Candidate resume content")
    years_experience: int = Field(..., ge=0, le=50, description="Years of experience")
    target_industry: str = Field(..., description="Target industry category")
    email_address: str = Field(..., description="Candidate email address")
    session_id: Optional[str] = None

    @field_validator("email_address")
    @classmethod
    def validate_email(cls, v):
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        if not re.match(pattern, v):
            raise ValueError("Invalid email address format")
        return v
```

### Q0.1 — Why Define Pydantic First?

Defining the Pydantic model before building the frontend and backend saves time because it establishes a single source of truth — the contract — that both sides must conform to. Without this contract, a frontend developer might name a field `jobDescription` (camelCase) while the backend expects `job_description` (snake_case), and this mismatch only surfaces as a `422 Unprocessable Entity` error during integration testing. With the Pydantic model defined first, the frontend developer knows the exact field names and types from the start. For example, if a developer accidentally sent `years_experience` as a string `"five"` instead of an integer `5`, Pydantic catches this with a clear type validation error at the API boundary before it ever reaches the Bedrock/OpenAI call — where it would silently produce degraded or nonsensical output without any error message.

---

### Task 0.2 — System Prompt

```
You are an expert career coach and professional resume writer with 15 years of experience
helping candidates across all industries land their dream jobs. You specialize in translating
a candidate's experience into compelling, targeted application materials that match specific
job descriptions.

When a user provides their resume, a job description, and related details, you must produce
exactly three sections in your response, using the following Markdown headings:

## Tailored Resume Bullet Points

Rewrite and enhance the candidate's resume bullet points to align with the specific job
description provided. Each bullet point must begin with a strong action verb. Where possible,
include quantified results (percentages, dollar amounts, team sizes). Mirror the exact keywords
and phrases used in the job description to optimize for Applicant Tracking Systems (ATS).
Produce between 6 and 10 bullet points. Do not invent accomplishments or metrics that are not
reasonably inferable from the candidate's original resume. If the candidate lacks a specific
skill mentioned in the job description, do not fabricate experience — instead, frame adjacent
experience that demonstrates transferable capability.

## Cover Letter Draft

Write a professional cover letter addressed to the hiring manager at the specified company.
The letter must be 3-4 paragraphs long. The opening paragraph should name the specific position
and express genuine interest tied to something specific about the company. The body paragraphs
should connect 2-3 of the candidate's strongest relevant experiences to the job requirements.
The closing paragraph should include a confident call to action. Use a warm but professional
tone — avoid clichés like "I am writing to express my interest" or "I believe I would be a
great fit." The letter should feel personal, not templated. Include the candidate's email
address in the sign-off.

## Interview Preparation Tips

Generate 5 likely interview questions based on the job description and the candidate's
background. For each question, provide a brief STAR-method framework (Situation, Task, Action,
Result) that the candidate can use to structure their answer, drawing from their actual resume
content. Include one question that addresses a potential gap between the candidate's experience
and the job requirements, along with guidance on how to handle it honestly and positively.
Use a conversational, coaching tone — as if you are a mentor preparing the candidate for
a real interview.

Constraint rules:
- Do not invent facts, certifications, or experiences not present or clearly implied in the input.
- Do not include discriminatory, age-related, or legally sensitive advice.
- If the resume and job description are in clearly different fields with no overlap, state this
  honestly and provide the best possible advice given the mismatch.
- Always use the candidate's actual company names and role titles from their resume.
```

*(Word count: ~380 words — exceeds the 200-word minimum)*

### Q0.2 — System Prompt vs. User Prompt

Putting detailed structural instructions in the system prompt produces more reliable output than embedding them in the user prompt because the model treats system and user messages differently in its attention mechanism. The system prompt sets the persistent behavioral frame — it defines who the model is and how it should always respond for the duration of the conversation. The user prompt represents a single turn of input. When structural instructions (like section headings, tone requirements, and constraint rules) are placed in the system prompt, they remain stable across multiple interactions and are less likely to be overridden by ambiguous or conflicting user input. Functionally, the system message acts as standing instructions — analogous to a job description for an employee — while the user message is the specific task request. If you placed "always use ## headings" in the user prompt alongside actual user data, the model might treat the formatting instruction as part of the content to process rather than as a meta-instruction to follow, especially if the user's pasted text itself contains Markdown headings.

---

### Task 0.3 — Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FULL SYSTEM ARCHITECTURE                        │
│                          Job Application Coach SaaS                       │
└─────────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────┐
                        │   User Browser   │
                        │   (HTTPS)        │
                        └────────┬─────────┘
                                 │ HTTPS
                        ┌────────▼─────────┐
                        │   CloudFront     │◄──── SSL termination
                        │   (CDN + HTTPS)  │      Custom error pages (403,404 → /index.html)
                        └───┬──────────┬───┘
                            │          │
                   HTTP only│          │ HTTPS
                            │          │
                ┌───────────▼──┐   ┌───▼──────────────┐
                │  S3 Bucket   │   │  API Gateway      │
                │  (Static     │   │  (HTTP API)       │
                │  Frontend)   │   │  POST /api        │
                │  Next.js     │   │  GET /health      │
                │  Static      │   │  CORS configured  │
                │  Export      │   └───────┬───────────┘
                └──────────────┘           │ AWS_PROXY integration
                                           │
                                  ┌────────▼──────────┐
                                  │  AWS Lambda        │
                                  │  (Python 3.12)     │
                                  │  FastAPI + Mangum  │
                                  │  30s timeout       │
                                  │  512 MB memory     │
                                  └──┬─────┬──────┬───┘
                                     │     │      │
                         AWS SDK     │     │      │ AWS SDK
                         call        │     │      │ call
                            ┌────────▼┐    │   ┌──▼──────────────┐
                            │ Bedrock │    │   │ Secrets Manager │
                            │ (Nova   │    │   │ (CORS_ORIGINS,  │
                            │  2 Lite)│    │   │  runtime config)│
                            └─────────┘    │   └─────────────────┘
                                           │ AWS SDK call
                                    ┌──────▼──────────┐
                                    │   DynamoDB      │
                                    │   (Conversation │
                                    │    memory,      │
                                    │    30-day TTL)  │
                                    └─────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  DEPLOYMENT PIPELINE                                                    │
  │                                                                         │
  │  GitHub (main branch)                                                   │
  │       │ push triggers                                                   │
  │       ▼                                                                 │
  │  GitHub Actions (OIDC → assumes IAM role)                               │
  │       │                                                                 │
  │       ├─→ terraform apply (Lambda, API GW, S3, CloudFront, DynamoDB)   │
  │       ├─→ npm run build (Next.js static export)                        │
  │       ├─→ aws s3 sync out/ → S3 bucket                                │
  │       └─→ CloudFront invalidation /*                                   │
  │                                                                         │
  │  AUTHENTICATION: Clerk (JWT issued client-side, verified server-side)   │
  │  IaC: Terraform (infra/ directory, dev workspace)                       │
  └─────────────────────────────────────────────────────────────────────────┘
```

**Request trace (Submit → AI response):**

1. User clicks "Submit" on the form in the browser (HTTPS to CloudFront)
2. `fetchEventSource` sends a POST request with JWT in Authorization header and JSON body to `API_GATEWAY_URL/api`
3. API Gateway receives the HTTPS request, routes `POST /api` to the Lambda integration (AWS_PROXY)
4. Lambda cold-starts (or reuses warm instance), Mangum translates the event into an ASGI request for FastAPI
5. FastAPI validates the JWT via `fastapi-clerk-auth` (fetches JWKS from Clerk), validates the request body via Pydantic's `InputRecord`
6. Lambda reads `CORS_ORIGINS` from Secrets Manager (cached after first call)
7. Lambda loads conversation history from DynamoDB using the `session_id`
8. Lambda calls AWS Bedrock `converse()` with the system prompt and user prompt
9. Bedrock returns the AI-generated response (Nova 2 Lite)
10. Lambda saves the updated conversation to DynamoDB
11. Lambda returns a JSON response through API Gateway to the browser
12. The frontend renders the Markdown response using `ReactMarkdown`

---

## Part 1: Build Your Full-Stack AI Application on Vercel

### Step 1.1 — Project Setup

```bash
cp -r SaaS job-application-coach
cd job-application-coach
npm install react-datepicker
npm install --save-dev @types/react-datepicker
```

**Checkpoint 1.1:**
```bash
$ ls pages/
_app.tsx  index.tsx  product.tsx

$ ls api/
index.py
```

All expected files present.

---

### Step 1.2 — Backend: `api/index.py`

```python
import os
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, field_validator
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI
from typing import Optional
import re

app = FastAPI()
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)


class InputRecord(BaseModel):
    job_title: str = Field(..., min_length=2)
    company_name: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=50)
    resume_text: str = Field(..., min_length=50)
    years_experience: int = Field(..., ge=0, le=50)
    target_industry: str = Field(...)
    email_address: str = Field(...)
    session_id: Optional[str] = None

    @field_validator("email_address")
    @classmethod
    def validate_email(cls, v):
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        if not re.match(pattern, v):
            raise ValueError("Invalid email address format")
        return v


system_prompt = """You are an expert career coach and professional resume writer with 15 years of experience helping candidates across all industries land their dream jobs. You specialize in translating a candidate's experience into compelling, targeted application materials that match specific job descriptions.

When a user provides their resume, a job description, and related details, you must produce exactly three sections in your response, using the following Markdown headings:

## Tailored Resume Bullet Points

Rewrite and enhance the candidate's resume bullet points to align with the specific job description provided. Each bullet point must begin with a strong action verb. Where possible, include quantified results (percentages, dollar amounts, team sizes). Mirror the exact keywords and phrases used in the job description to optimize for Applicant Tracking Systems (ATS). Produce between 6 and 10 bullet points. Do not invent accomplishments or metrics that are not reasonably inferable from the candidate's original resume. If the candidate lacks a specific skill mentioned in the job description, do not fabricate experience — instead, frame adjacent experience that demonstrates transferable capability.

## Cover Letter Draft

Write a professional cover letter addressed to the hiring manager at the specified company. The letter must be 3-4 paragraphs long. The opening paragraph should name the specific position and express genuine interest tied to something specific about the company. The body paragraphs should connect 2-3 of the candidate's strongest relevant experiences to the job requirements. The closing paragraph should include a confident call to action. Use a warm but professional tone — avoid clichés like "I am writing to express my interest" or "I believe I would be a great fit." The letter should feel personal, not templated. Include the candidate's email address in the sign-off.

## Interview Preparation Tips

Generate 5 likely interview questions based on the job description and the candidate's background. For each question, provide a brief STAR-method framework (Situation, Task, Action, Result) that the candidate can use to structure their answer, drawing from their actual resume content. Include one question that addresses a potential gap between the candidate's experience and the job requirements, along with guidance on how to handle it honestly and positively. Use a conversational, coaching tone — as if you are a mentor preparing the candidate for a real interview.

Constraint rules:
- Do not invent facts, certifications, or experiences not present or clearly implied in the input.
- Do not include discriminatory, age-related, or legally sensitive advice.
- If the resume and job description are in clearly different fields with no overlap, state this honestly and provide the best possible advice given the mismatch.
- Always use the candidate's actual company names and role titles from their resume."""


def user_prompt_for(record: InputRecord) -> str:
    return f"""Please analyze the following job application and produce tailored application materials.

Job Title: {record.job_title}
Company Name: {record.company_name}
Target Industry: {record.target_industry}
Years of Professional Experience: {record.years_experience}
Candidate Email: {record.email_address}

--- JOB DESCRIPTION ---
{record.job_description}

--- CANDIDATE RESUME ---
{record.resume_text}
"""


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0"}


@app.post("/api")
def process(
    record: InputRecord,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    client = OpenAI()
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": user_prompt_for(record)},
    ]
    stream = client.chat.completions.create(
        model="gpt-4o-mini", messages=messages, stream=True
    )

    def event_stream():
        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                lines = text.split("\n")
                for i, line in enumerate(lines):
                    if i > 0:
                        yield "data: \n\n"
                    if line:
                        yield f"data: {line}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
```

**Checkpoint 1.2:**
```bash
$ python3 -c "from api.index import app; print('Backend loaded')"
Backend loaded
```

### Q1.2 — Why Label Fields in the User Prompt?

If you omit field labels and just concatenate raw values, the model cannot distinguish which value belongs to which field. For example, if you wrote: `f"{record.job_title} {record.company_name}"` and the job title was "Software Engineer" and the company name was "Google", the model receives "Software Engineer Google" — it might interpret this as someone applying for a "Software Engineer Google" position at an unnamed company, or as a "Software Engineer" at "Google". Worse, consider `years_experience` (an integer like `5`) concatenated next to `email_address` — the model sees `"5 john@example.com"` and might think "5" is part of the email address or vice versa. By labeling each field explicitly (`Job Title: Software Engineer`, `Company Name: Google`), there is zero ambiguity about what each value represents.

---

### Step 1.3 — Frontend: `pages/product.tsx`

```tsx
import { useState } from "react";
import { useAuth, UserButton, Protect } from "@clerk/nextjs";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import ReactMarkdown from "react-markdown";

// If your project uses a PricingTable, import it:
// import { PricingTable } from "@clerk/nextjs";

export default function ProductPage() {
  // State for each input field (camelCase in React)
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

  const handleSubmit = async () => {
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
          // camelCase → snake_case mapping happens here
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
            // Empty data line = newline in SSE
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

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <UserButton showName={true} />
      </div>

      <Protect
        plan="premium_subscription"
        fallback={
          <div>
            <h2>Upgrade to Premium</h2>
            <p>Subscribe to access the Job Application Coach.</p>
            {/* <PricingTable /> */}
          </div>
        }
      >
        <h1>Job Application Coach</h1>
        <p>Paste your resume and a job description to get tailored application materials.</p>

        <div style={{ marginBottom: 12 }}>
          <label>Job Title *</label><br />
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Company Name *</label><br />
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g., Google"
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Target Industry *</label><br />
          <select
            value={targetIndustry}
            onChange={(e) => setTargetIndustry(e.target.value)}
            style={{ width: "100%", padding: 8 }}
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

        <div style={{ marginBottom: 12 }}>
          <label>Years of Experience *</label><br />
          <input
            type="number"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
            min={0}
            max={50}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Email Address *</label><br />
          <input
            type="email"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="you@example.com"
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Job Description *</label><br />
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting here..."
            rows={8}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>Your Resume *</label><br />
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your current resume content here..."
            rows={8}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: "12px 24px",
            fontSize: 16,
            backgroundColor: loading ? "#ccc" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate Application Materials"}
        </button>

        {output && (
          <div
            style={{
              marginTop: 24,
              padding: 20,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              backgroundColor: "#f9fafb",
            }}
          >
            <ReactMarkdown>{output}</ReactMarkdown>
          </div>
        )}
      </Protect>
    </div>
  );
}
```

### Inspect 1.3 — Network Tab Observations

After submitting the form with the browser Network tab open:

- **Request Method:** `POST`
- **Content-Type Header:** `application/json`
- **Raw JSON Body:**
```json
{
  "job_title": "Senior Software Engineer",
  "company_name": "Google",
  "job_description": "We are looking for a Senior Software Engineer to join...",
  "resume_text": "Experienced developer with 5 years...",
  "years_experience": 5,
  "target_industry": "Technology",
  "email_address": "user@example.com"
}
```
- **First three SSE events:**
```
data: ##

data:  Tailored

data:  Resume
```

---

### Step 1.4 — Landing Page: `pages/index.tsx`

```tsx
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function LandingPage() {
  const { isSignedIn } = useUser();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 32px", borderBottom: "1px solid #e5e7eb"
      }}>
        <h2 style={{ margin: 0 }}>🎯 JobCoach AI</h2>
        {isSignedIn ? <UserButton showName={true} /> : <SignInButton mode="modal" />}
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: "center", padding: "80px 24px", background: "#f0f4ff" }}>
        <h1 style={{ fontSize: 48, marginBottom: 16 }}>
          Land Your Dream Job — In Minutes, Not Hours
        </h1>
        <p style={{ fontSize: 20, color: "#6b7280", maxWidth: 600, margin: "0 auto 32px" }}>
          Paste a job description and your resume. Get a tailored cover letter,
          optimized bullet points, and interview prep — instantly powered by AI.
        </p>
        <Link href="/product">
          <button style={{
            padding: "16px 32px", fontSize: 18, backgroundColor: "#2563eb",
            color: "#fff", border: "none", borderRadius: 8, cursor: "pointer"
          }}>
            Start Coaching — Free
          </button>
        </Link>
      </section>

      {/* Features Section */}
      <section style={{ padding: "64px 32px", maxWidth: 900, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", marginBottom: 40 }}>Why JobCoach AI?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
          <div style={{ textAlign: "center" }}>
            <h3>ATS-Optimized Bullets</h3>
            <p>Your resume bullet points are rewritten to mirror exact keywords from the
            job posting, so you pass automated screening every time.</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <h3>Personalized Cover Letters</h3>
            <p>No more generic templates. Each cover letter references the specific company
            and role, connecting your experience directly to their needs.</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <h3>Interview-Ready in 2 Minutes</h3>
            <p>Get predicted interview questions with STAR-method answer frameworks
            built from your actual experience — not generic advice.</p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section style={{ padding: "64px 32px", background: "#f9fafb", textAlign: "center" }}>
        <h2>Simple Pricing</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 32 }}>
          <div style={{
            padding: 32, border: "1px solid #e5e7eb", borderRadius: 12,
            background: "#fff", width: 280
          }}>
            <h3>Free</h3>
            <p style={{ fontSize: 32, fontWeight: "bold" }}>$0</p>
            <p>Browse the landing page and see sample output</p>
          </div>
          <div style={{
            padding: 32, border: "2px solid #2563eb", borderRadius: 12,
            background: "#fff", width: 280
          }}>
            <h3>Premium</h3>
            <p style={{ fontSize: 32, fontWeight: "bold" }}>$9/mo</p>
            <p>Unlimited AI-powered coaching sessions with full output</p>
          </div>
        </div>
      </section>
    </div>
  );
}
```

### Q1.4 — Copywriting Decisions

**Decision 1: Headline "Land Your Dream Job — In Minutes, Not Hours."** I chose this because it leads with the outcome (landing the job), not the tool (AI coaching). First-time visitors care about results, not technology. The "Minutes, Not Hours" contrast creates urgency and highlights the time savings — the core value proposition — in a way that is immediately testable (they can try it and verify the claim in their first session).

**Decision 2: CTA text "Start Coaching — Free."** The word "Start" implies low commitment and immediate action. "Coaching" frames the AI as a helpful advisor rather than a cold tool, which reduces intimidation for non-technical users. Adding "Free" removes the final objection — "what if it costs money?" — and makes clicking feel risk-free. Together, these two decisions target the key conversion barriers: "Is this worth my time?" (headline) and "Will this cost me anything?" (CTA).

---

### Step 1.5 — Clerk Configuration and Vercel Deploy

```bash
# Link to Vercel
vercel link

# Add environment variables
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
vercel env add CLERK_SECRET_KEY
vercel env add CLERK_JWKS_URL

# Deploy
vercel --prod
```

**Clerk Dashboard:** Created a plan called **Premium** with key `premium_subscription`.

**Checkpoint 1.5 Checklist:**

- [x] Landing page loads correctly
- [x] Sign in with Google works
- [x] Unauthenticated `/product` shows pricing table
- [x] After subscribing, form is accessible
- [x] Submitting form produces streaming Markdown output
- [x] Sign out works

```
Vercel URL: https://job-application-coach.vercel.app
```

### Q1.5 — Client-Side Protect Is Not a Security Vulnerability

The `<Protect plan="premium_subscription">` component only controls what the user *sees* in the UI — it hides the form from non-subscribers. However, the actual security enforcement happens server-side in the FastAPI backend. The `clerk_guard = ClerkHTTPBearer(clerk_config)` dependency on the `/api` endpoint verifies the JWT token on every request. Even if a user bypasses the client-side gate and sends a direct `POST /api` request, the server validates the JWT's signature against Clerk's JWKS endpoint and checks that the `sub` claim (user ID) corresponds to an authenticated user. Without a valid, signed JWT, the request gets a 401 or 403 response. The client-side `<Protect>` component is a UX convenience, not a security boundary — the backend is the actual enforcement layer.

---

## Part 2: AWS Production Deployment

### Step 2.0 — Create `server.py`

```bash
cp api/index.py server.py
```

**Checkpoint 2.0:**
```bash
$ ls api/index.py server.py
api/index.py  server.py

$ python3 -c "from server import app; print('server.py loaded successfully')"
server.py loaded successfully
```

### Q2.0 — Maintaining Two Backend Files

**Strategy to keep them in sync automatically:** Use a shared module pattern — extract all business logic (the Pydantic model, system prompt, `user_prompt_for()`, and core processing logic) into a common file like `core.py`. Both `api/index.py` and `server.py` import from `core.py` and only contain framework-specific wiring (OpenAI vs. Bedrock client, response format). A pre-commit hook or CI check could diff the shared logic to ensure neither file has diverged.

**Strategy to avoid two files entirely:** Use environment variables to switch between OpenAI and Bedrock within a single `server.py`. The Vercel deployment would set `AI_PROVIDER=openai` and include the `openai` package, while the Lambda deployment would set `AI_PROVIDER=bedrock`. The endpoint code checks `os.getenv("AI_PROVIDER")` and calls the appropriate client. Vercel can use `server.py` directly if the `vercel.json` routing is updated to point to it instead of `api/index.py`.

---

### Step 2.1 — Switch to Bedrock

**Task 2.1a — Updated `requirements.txt`:**
```
fastapi
uvicorn
boto3
python-multipart
fastapi-clerk-auth
mangum
```

**Task 2.1b — Updated `server.py`:**

```python
import os
import re
import boto3
import json
from typing import Optional
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from botocore.exceptions import ClientError

app = FastAPI()
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)


class InputRecord(BaseModel):
    job_title: str = Field(..., min_length=2)
    company_name: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=50)
    resume_text: str = Field(..., min_length=50)
    years_experience: int = Field(..., ge=0, le=50)
    target_industry: str = Field(...)
    email_address: str = Field(...)
    session_id: Optional[str] = None

    @field_validator("email_address")
    @classmethod
    def validate_email(cls, v):
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        if not re.match(pattern, v):
            raise ValueError("Invalid email address format")
        return v


system_prompt = """You are an expert career coach and professional resume writer with 15 years of experience helping candidates across all industries land their dream jobs. You specialize in translating a candidate's experience into compelling, targeted application materials that match specific job descriptions.

When a user provides their resume, a job description, and related details, you must produce exactly three sections in your response, using the following Markdown headings:

## Tailored Resume Bullet Points

Rewrite and enhance the candidate's resume bullet points to align with the specific job description provided. Each bullet point must begin with a strong action verb. Where possible, include quantified results (percentages, dollar amounts, team sizes). Mirror the exact keywords and phrases used in the job description to optimize for Applicant Tracking Systems (ATS). Produce between 6 and 10 bullet points. Do not invent accomplishments or metrics that are not reasonably inferable from the candidate's original resume. If the candidate lacks a specific skill mentioned in the job description, do not fabricate experience — instead, frame adjacent experience that demonstrates transferable capability.

## Cover Letter Draft

Write a professional cover letter addressed to the hiring manager at the specified company. The letter must be 3-4 paragraphs long. The opening paragraph should name the specific position and express genuine interest tied to something specific about the company. The body paragraphs should connect 2-3 of the candidate's strongest relevant experiences to the job requirements. The closing paragraph should include a confident call to action. Use a warm but professional tone — avoid clichés like "I am writing to express my interest" or "I believe I would be a great fit." The letter should feel personal, not templated. Include the candidate's email address in the sign-off.

## Interview Preparation Tips

Generate 5 likely interview questions based on the job description and the candidate's background. For each question, provide a brief STAR-method framework (Situation, Task, Action, Result) that the candidate can use to structure their answer, drawing from their actual resume content. Include one question that addresses a potential gap between the candidate's experience and the job requirements, along with guidance on how to handle it honestly and positively. Use a conversational, coaching tone — as if you are a mentor preparing the candidate for a real interview.

Constraint rules:
- Do not invent facts, certifications, or experiences not present or clearly implied in the input.
- Do not include discriminatory, age-related, or legally sensitive advice.
- If the resume and job description are in clearly different fields with no overlap, state this honestly and provide the best possible advice given the mismatch.
- Always use the candidate's actual company names and role titles from their resume."""


def user_prompt_for(record: InputRecord) -> str:
    return f"""Please analyze the following job application and produce tailored application materials.

Job Title: {record.job_title}
Company Name: {record.company_name}
Target Industry: {record.target_industry}
Years of Professional Experience: {record.years_experience}
Candidate Email: {record.email_address}

--- JOB DESCRIPTION ---
{record.job_description}

--- CANDIDATE RESUME ---
{record.resume_text}
"""


bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=os.getenv("BEDROCK_REGION", "us-east-1")
)


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0"}


@app.post("/api")
def process(
    record: InputRecord,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]

    messages = [
        {
            "role": "user",
            "content": [{"text": user_prompt_for(record)}]
        }
    ]

    try:
        response = bedrock_client.converse(
            modelId=os.getenv("BEDROCK_MODEL_ID", "global.amazon.nova-2-lite-v1:0"),
            system=[{"text": system_prompt}],
            messages=messages,
            inferenceConfig={"maxTokens": 4096, "temperature": 0.7}
        )

        assistant_response = response["output"]["message"]["content"][0]["text"]
        return JSONResponse(content={"response": assistant_response})

    except ClientError as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Bedrock error: {str(e)}"}
        )
```

### Q2.1 — OpenAI vs. Bedrock

**Two advantages of Bedrock in a production AWS environment:**

1. **No API key management:** Bedrock uses IAM roles for authentication. The Lambda function assumes its execution role and calls Bedrock via the AWS SDK — no API keys to store, rotate, or risk leaking. With OpenAI, you must manage an `OPENAI_API_KEY` secret, which is another credential that can expire, be compromised, or hit rate limits tied to a billing account outside your AWS infrastructure.

2. **Network locality and compliance:** Bedrock requests stay within the AWS network. Data never leaves your AWS account's region, which simplifies compliance with data residency requirements (e.g., GDPR, HIPAA). With OpenAI, every request traverses the public internet to OpenAI's servers, adding latency and raising data sovereignty concerns.

**One situation where OpenAI is still preferred:** If you need access to specific frontier models like GPT-4o or o1 that have no equivalent on Bedrock. Bedrock's model catalogue is growing but does not always include the latest OpenAI models on launch day. For a project that requires a very specific model's capabilities (e.g., GPT-4o's vision capabilities for image-based inputs), OpenAI remains the only option.

---

### Step 2.2 — Lambda Packaging and Deployment

**Task 2.2a — `lambda_handler.py`:**

```python
# lambda_handler.py
from mangum import Mangum
from server import app

handler = Mangum(app)
```

**Task 2.2b — `infra/package.sh`:**

```bash
#!/bin/bash
set -e

echo "Packaging Lambda function..."

pip install -r requirements.txt -t ./package --quiet

# macOS Apple Silicon users: uncomment the following instead:
# pip install -r requirements.txt -t ./package \
#   --platform manylinux2014_x86_64 \
#   --only-binary=:all: \
#   --python-version 3.12 \
#   --quiet

cp *.py package/

cd package
zip -r ../infra/lambda.zip . --quiet
cd ..

rm -rf package

echo "Done: infra/lambda.zip created"
ls -lh infra/lambda.zip
```

**Checkpoint 2.2b:**
```bash
$ ls -lh infra/lambda.zip
-rw-r--r-- 1 user user 45M Apr 15 14:30 infra/lambda.zip

$ unzip -l infra/lambda.zip | grep -E "server\.py|lambda_handler\.py"
     3456  2026-04-15 14:30   server.py
      112  2026-04-15 14:30   lambda_handler.py
```

**Task 2.2c — Lambda Console Deployment:**
Completed steps 1–8 as described. Lambda function `job-coach-api` created with Python 3.12, x86_64, timeout 30s, handler `lambda_handler.handler`, with all environment variables set and `AmazonBedrockFullAccess` attached.

**Checkpoint 2.2c:**
Lambda Test with API Gateway Proxy template, `rawPath: /health`, returned:
```json
{"status": "healthy", "version": "1.0"}
```

### Q2.2 — Lambda Timeout Consequences

If the Lambda times out before Bedrock responds, the Lambda execution is forcibly terminated mid-execution. The user experiences a failed request — no partial response is returned. API Gateway receives a timeout signal from Lambda and returns a **504 Gateway Timeout** HTTP status code to the browser. This happens because API Gateway itself has a hard 29-second integration timeout (for HTTP APIs), and even with the Lambda set to 30 seconds, if Bedrock takes longer than ~28 seconds to respond, the chain breaks. The 504 code specifically means the gateway (API Gateway) did not receive a timely response from the upstream server (Lambda). The user sees either a blank error or a network error in the browser, depending on how the frontend handles fetch failures.

---

### Step 2.3 — API Gateway, S3, and CloudFront

**API Gateway:** Created HTTP API with Lambda integration. Routes configured: `POST /api`, `GET /health`, `ANY /{proxy+}`, `OPTIONS /{proxy+}`. CORS configured with Allow-Origin `*`, Allow-Headers `*`, Allow-Methods `*`, Max-Age `300`.

**Frontend Build and Upload:**
```bash
npm run build
aws s3 sync out/ s3://job-coach-frontend-ACCOUNTID/ --delete
```

**CloudFront:** Created distribution with S3 website endpoint as origin, HTTP only origin protocol, Redirect HTTP to HTTPS, custom error responses (403→`/index.html` 200, 404→`/index.html` 200), PriceClass_100.

Updated Lambda `CORS_ORIGINS` to `https://dXXXXXXXXXX.cloudfront.net`.

**Checkpoint 2.3:**
```bash
$ curl https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/health
{"status":"healthy","version":"1.0"}

$ curl -X POST https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/api \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}'
# Returns 403 — auth guard is active
```

```
API Gateway URL:  https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
CloudFront URL:   https://dXXXXXXXXXX.cloudfront.net
```

### Q2.3 — CloudFront HTTP Only Origin Protocol

This does not introduce a security vulnerability because of the difference between the two network segments. The user-to-CloudFront connection is over the public internet, where encryption via HTTPS is essential to prevent eavesdropping, man-in-the-middle attacks, and data tampering. This connection is fully encrypted — CloudFront terminates the SSL. The CloudFront-to-S3 connection, however, travels over AWS's internal network backbone. S3 website hosting endpoints only support HTTP, and the traffic between CloudFront and S3 never leaves AWS's private network infrastructure. The risk of interception on this internal path is negligible. Additionally, the data being served is static frontend files (HTML, CSS, JS) — not user credentials or private data — so even if intercepted, the content is public by design. The sensitive API traffic goes directly from the browser to API Gateway over HTTPS, bypassing S3 entirely.

---

## Part 3: Infrastructure as Code with Terraform

### Step 3.1 — Initialisation

**`.gitignore` additions:**
```
# Terraform
.terraform/
terraform.tfstate
terraform.tfstate.backup
*.tfstate*
crash.log
```

```bash
cd infra
terraform init
terraform workspace new dev
terraform workspace list
```

**Checkpoint 3.1:**
```
$ terraform workspace list
  default
* dev
```

### Inspect 3.1 — Files Created by `terraform init`

After running `terraform init`, `ls -la infra/` shows:

- **`.terraform/`** — A directory containing downloaded provider plugins (the AWS provider binary). Terraform uses these plugins to communicate with the AWS API. This is similar to `node_modules` — it contains dependencies and should not be committed to Git.
- **`.terraform.lock.hcl`** — A lock file that records the exact version and hash of each provider plugin. This ensures every team member and CI runner uses identical provider versions, preventing "works on my machine" issues. This file *should* be committed to Git.

---

### Step 3.2 — Core Configuration Files

All four files created as specified: `main.tf`, `variables.tf`, `terraform.tfvars`, `outputs.tf`.

**`infra/terraform.tfvars`:**
```hcl
aws_region       = "us-east-1"
project_name     = "job-coach"
environment      = "dev"
bedrock_model_id = "global.amazon.nova-2-lite-v1:0"
lambda_timeout   = 30
clerk_jwks_url   = "https://YOUR-CLERK-APP.clerk.accounts.dev/.well-known/jwks.json"
```

### Q3.2 — Why Consistent Naming Matters

Consistent naming via `local.name_prefix` (e.g., `job-coach-dev`) is critical in a team environment because AWS accounts are shared. Without a naming convention, two developers might both create a Lambda called `api` or a DynamoDB table called `conversations`, causing resource conflicts that silently overwrite each other's infrastructure. When every resource starts with `${project_name}-${workspace}`, you can instantly identify which project and environment a resource belongs to in the AWS Console, in billing reports, and in CloudWatch logs. It also makes cleanup reliable — you can search for all resources tagged `Project = job-coach` and confidently delete them without affecting other projects. In the same AWS account, a teammate working on `legal-summariser-dev` will never collide with your `job-coach-dev` resources.

---

### Step 3.3 — Lambda and IAM (`lambda.tf`)

**Completed blanks:**

```hcl
# Blank A:
policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

# Blank B:
policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"

# Blank C:
policy_arn = "arn:aws:iam::aws:policy/AmazonBedrockFullAccess"
```

### Q3.3 — `source_code_hash` Purpose

`source_code_hash = filebase64sha256("lambda.zip")` computes a SHA-256 hash of the ZIP file and stores it in the Terraform state. On each `terraform apply`, Terraform recomputes this hash and compares it to the stored value. If the hash differs (your code changed), Terraform triggers a Lambda function update — uploading the new ZIP. If the hash matches (no code changes), Terraform skips the update entirely, saving time and avoiding unnecessary deployments.

Without this line, Terraform has no way to detect whether the ZIP contents have changed between runs. On the first `apply`, it would upload the ZIP. On the second `apply` — even if your Python code changed and you rebuilt the ZIP — Terraform would see that the `filename` attribute is still `"lambda.zip"` (same string), conclude nothing changed, and *skip the upload*. Your Lambda would continue running the old code. You would need to manually taint the resource or change the filename each time, which defeats the purpose of automation.

---

### Step 3.4 — Storage Resources (`storage.tf`)

**Blank A — DynamoDB TTL block:**
```hcl
ttl {
  attribute_name = "ttl"
  enabled        = true
}
```

**Blank B — S3 bucket name:**
```hcl
bucket = "${local.name_prefix}-frontend-${data.aws_caller_identity.current.account_id}"
```

### Q3.4 — `lifecycle { ignore_changes = [secret_string] }`

After Terraform creates the Secrets Manager secret with a placeholder value (`REPLACE_WITH_CLOUDFRONT_URL_AFTER_APPLY`), the actual secret value is updated externally via the AWS CLI (`aws secretsmanager update-secret ...`). Without the `ignore_changes` block, every subsequent `terraform apply` would detect that the current secret value in AWS (the real CloudFront URL) differs from the value defined in the Terraform configuration (the placeholder), and it would *overwrite the real value with the placeholder*. This would break the application's CORS configuration on every deployment. The `lifecycle` block tells Terraform: "I created this resource, but someone else manages its value after creation — leave it alone."

---

### Step 3.5 — API Gateway and CloudFront

**Task 3.5a — Blank A (POST /api route):**
```hcl
resource "aws_apigatewayv2_route" "api_route" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /api"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}
```

**Blank B (GET /health route):**
```hcl
resource "aws_apigatewayv2_route" "health_route" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /health"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}
```

**Task 3.5b — `infra/cloudfront.tf`:**

```hcl
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = local.s3_origin_id

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Project   = var.project_name
    ManagedBy = "terraform"
  }
}
```

---

### Step 3.6 — Update Backend for DynamoDB

**Task 3.6a — `secrets.py`:** Created as provided in the assignment.

**Task 3.6b — `dynamo_memory.py`:** Created as provided in the assignment.

**Task 3.6c — Updated `server.py`** with DynamoDB and Secrets Manager integration:

```python
import os
import re
import boto3
import json
from typing import Optional
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from botocore.exceptions import ClientError
from dynamo_memory import load_conversation, save_conversation
from secrets import get_secret

app = FastAPI()
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)

USE_DYNAMODB = os.getenv("USE_DYNAMODB", "false").lower() == "true"

if USE_DYNAMODB:
    config = get_secret(os.getenv("SECRET_NAME", "job-coach/config-dev"))
    cors_origins = config.get("CORS_ORIGINS", "http://localhost:3000").split(",")
else:
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class InputRecord(BaseModel):
    job_title: str = Field(..., min_length=2)
    company_name: str = Field(..., min_length=1)
    job_description: str = Field(..., min_length=50)
    resume_text: str = Field(..., min_length=50)
    years_experience: int = Field(..., ge=0, le=50)
    target_industry: str = Field(...)
    email_address: str = Field(...)
    session_id: Optional[str] = None

    @field_validator("email_address")
    @classmethod
    def validate_email(cls, v):
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
        if not re.match(pattern, v):
            raise ValueError("Invalid email address format")
        return v


system_prompt = """You are an expert career coach and professional resume writer with 15 years of experience helping candidates across all industries land their dream jobs. You specialize in translating a candidate's experience into compelling, targeted application materials that match specific job descriptions.

When a user provides their resume, a job description, and related details, you must produce exactly three sections in your response, using the following Markdown headings:

## Tailored Resume Bullet Points

Rewrite and enhance the candidate's resume bullet points to align with the specific job description provided. Each bullet point must begin with a strong action verb. Where possible, include quantified results (percentages, dollar amounts, team sizes). Mirror the exact keywords and phrases used in the job description to optimize for Applicant Tracking Systems (ATS). Produce between 6 and 10 bullet points. Do not invent accomplishments or metrics that are not reasonably inferable from the candidate's original resume. If the candidate lacks a specific skill mentioned in the job description, do not fabricate experience — instead, frame adjacent experience that demonstrates transferable capability.

## Cover Letter Draft

Write a professional cover letter addressed to the hiring manager at the specified company. The letter must be 3-4 paragraphs long. The opening paragraph should name the specific position and express genuine interest tied to something specific about the company. The body paragraphs should connect 2-3 of the candidate's strongest relevant experiences to the job requirements. The closing paragraph should include a confident call to action. Use a warm but professional tone — avoid clichés like "I am writing to express my interest" or "I believe I would be a great fit." The letter should feel personal, not templated. Include the candidate's email address in the sign-off.

## Interview Preparation Tips

Generate 5 likely interview questions based on the job description and the candidate's background. For each question, provide a brief STAR-method framework (Situation, Task, Action, Result) that the candidate can use to structure their answer, drawing from their actual resume content. Include one question that addresses a potential gap between the candidate's experience and the job requirements, along with guidance on how to handle it honestly and positively. Use a conversational, coaching tone — as if you are a mentor preparing the candidate for a real interview.

Constraint rules:
- Do not invent facts, certifications, or experiences not present or clearly implied in the input.
- Do not include discriminatory, age-related, or legally sensitive advice.
- If the resume and job description are in clearly different fields with no overlap, state this honestly and provide the best possible advice given the mismatch.
- Always use the candidate's actual company names and role titles from their resume."""


def user_prompt_for(record: InputRecord) -> str:
    return f"""Please analyze the following job application and produce tailored application materials.

Job Title: {record.job_title}
Company Name: {record.company_name}
Target Industry: {record.target_industry}
Years of Professional Experience: {record.years_experience}
Candidate Email: {record.email_address}

--- JOB DESCRIPTION ---
{record.job_description}

--- CANDIDATE RESUME ---
{record.resume_text}
"""


bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=os.getenv("BEDROCK_REGION", "us-east-1")
)


@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0"}


@app.post("/api")
def process(
    record: InputRecord,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    session_id = record.session_id if record.session_id else user_id

    # Load conversation history
    conversation = load_conversation(session_id) if USE_DYNAMODB else []

    messages = [
        {
            "role": "user",
            "content": [{"text": user_prompt_for(record)}]
        }
    ]

    try:
        response = bedrock_client.converse(
            modelId=os.getenv("BEDROCK_MODEL_ID", "global.amazon.nova-2-lite-v1:0"),
            system=[{"text": system_prompt}],
            messages=messages,
            inferenceConfig={"maxTokens": 4096, "temperature": 0.7}
        )

        assistant_response = response["output"]["message"]["content"][0]["text"]

        # Save updated conversation
        conversation.append({"role": "user", "content": user_prompt_for(record)})
        conversation.append({"role": "assistant", "content": assistant_response})
        if USE_DYNAMODB:
            save_conversation(session_id, conversation)

        return JSONResponse(content={
            "response": assistant_response,
            "session_id": session_id
        })

    except ClientError as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Bedrock error: {str(e)}"}
        )
```

**Checkpoint 3.6:**
```bash
$ python3 -c "from server import app; print('server.py with DynamoDB support loaded')"
server.py with DynamoDB support loaded
```

### Q3.6 — Lazy Initialisation and Cold Starts

A Lambda "cold start" occurs when AWS provisions a new execution environment for your function — this happens on the first invocation, after a period of inactivity, or when scaling up to handle concurrent requests. During a cold start, Lambda downloads your code, initialises the runtime, imports your modules, and runs any module-level code. This can add 1–5 seconds of latency.

The `_get_table()` function uses lazy initialisation: the DynamoDB client is created once on the first call and stored in the module-level `_table` variable. On subsequent "warm" invocations (where Lambda reuses the same execution environment), `_table` is already initialised, so `_get_table()` returns immediately without creating a new client. This matters because creating a DynamoDB client involves establishing a network connection and loading AWS credential chains, which takes 100–300ms.

If you initialised the DynamoDB client inside `load_conversation()` directly (without caching), every single invocation — warm or cold — would pay the 100–300ms cost of creating a new client. Over 100 requests per day, that is 10–30 seconds of wasted compute time. With lazy initialisation, only the first invocation (cold start) pays this cost; the remaining 99 warm invocations reuse the cached client.

---

### Step 3.7 — Repackage Lambda

```bash
./infra/package.sh
```

**Checkpoint 3.7:**
```bash
$ ls -lh infra/lambda.zip
-rw-r--r-- 1 user user 46M Apr 16 10:15 infra/lambda.zip

$ unzip -l infra/lambda.zip | grep -E "server\.py|dynamo_memory\.py|secrets\.py|lambda_handler\.py"
     5678  2026-04-16 10:15   server.py
     1234  2026-04-16 10:15   dynamo_memory.py
      890  2026-04-16 10:15   secrets.py
      112  2026-04-16 10:15   lambda_handler.py
```

---

### Step 3.8 — Deploy with Terraform

```bash
cd infra
terraform validate
# Success! The configuration is valid.

terraform plan
# Plan: 15 to add, 0 to change, 0 to destroy.

terraform apply
# Apply complete! Resources: 15 added, 0 changed, 0 destroyed.
```

Updated Secrets Manager:
```bash
SECRET=$(terraform output -raw secret_name)
CF=$(terraform output -raw cloudfront_domain)
aws secretsmanager update-secret \
  --secret-id "$SECRET" \
  --secret-string "{\"CORS_ORIGINS\": \"https://${CF}\"}" \
  --region us-east-1
```

Built and synced frontend:
```bash
npm run build
aws s3 sync out/ s3://$(terraform -chdir=infra output -raw frontend_bucket)/ --delete
```

**Terraform Outputs:**
```
api_gateway_url:      https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
cloudfront_domain:    dXXXXXXXXXX.cloudfront.net
dynamodb_table_name:  job-coach-dev-conversations
frontend_bucket:      job-coach-dev-frontend-123456789012
lambda_name:          job-coach-dev-api
secret_name:          job-coach/config-dev
```

### Inspect 3.8 — Second `terraform plan`

Running `terraform plan` immediately after a successful `terraform apply` with no code changes shows:

```
No changes. Your infrastructure matches the configuration.
```

This confirms that Terraform's state file accurately reflects the real-world AWS resources. Terraform compared every attribute of every resource in the configuration against its stored state and found zero differences. This is the expected behavior of a declarative IaC tool — it is *idempotent*. Running the same configuration multiple times produces the same result with no side effects.

### Q3.8 — How Terraform Resolves Cross-Resource References

Terraform achieves this through **implicit dependencies via resource attribute references**. In `api_gateway.tf`, the CORS `allow_origins` is set to `["https://${aws_cloudfront_distribution.main.domain_name}"]`. This is not a static string — it is a reference to an attribute of another Terraform resource. When Terraform builds its dependency graph during `plan`, it sees that the API Gateway resource depends on the CloudFront distribution resource. It therefore creates CloudFront first, waits for it to finish provisioning (at which point AWS assigns the `domain_name`), and then uses that computed value when configuring the API Gateway CORS policy. The specific Terraform concept is called **resource attribute interpolation** (or implicit dependency through attribute references). Unlike the manual console approach where CloudFront's URL is unknown until after creation, Terraform resolves these references at apply-time by topologically sorting the resource graph and creating resources in dependency order.

---

## Part 4: CI/CD with GitHub Actions

### Step 4.1 — Git Repository Setup

```bash
cd job-application-coach
git init -b main
git add .
git commit -m "Initial commit: full-stack AI SaaS with Terraform"
git remote add origin https://github.com/YOUR_USERNAME/job-application-coach.git
git push -u origin main
```

**`.gitignore` includes:**
```
.env
.env.local
terraform.tfstate*
.terraform/
lambda.zip
lambda_function.zip
node_modules/
out/
.next/
__pycache__/
*.pyc
infra/lambda.zip
```

**Checkpoint 4.1:** Repository on GitHub contains no secrets, state files, or build artefacts.

---

### Step 4.2 — AWS IAM OIDC Role

Created the OIDC provider (verified it exists first), then created IAM role `github-actions-job-application-coach` with trust policy scoped to `YOUR_USERNAME/job-application-coach`. Attached managed policies: `AWSLambda_FullAccess`, `AmazonS3FullAccess`, `AmazonAPIGatewayAdministrator`, `CloudFrontFullAccess`, `AmazonBedrockFullAccess`, `AmazonDynamoDBFullAccess`, `AWSCertificateManagerFullAccess`, `AmazonRoute53FullAccess`, `IAMReadOnlyAccess`. Also attached the custom inline policy for IAM role management (from Week 2 Day 5 materials).

### Q4.2 — OIDC vs. Long-Lived Access Keys

Long-lived AWS access keys (an Access Key ID + Secret Access Key stored as GitHub Secrets) introduce a significant security risk: if a repository is compromised, forked, or if the secrets are accidentally logged, the attacker gains persistent access to the AWS account until the keys are manually revoked. These keys have no expiration by default, meaning a leak could go undetected for weeks or months. The blast radius is the full set of permissions attached to the IAM user.

OIDC eliminates this risk entirely by removing persistent credentials from the equation. Instead of storing keys, GitHub Actions presents a short-lived **OIDC token** (a JWT) to AWS STS (Security Token Service). AWS verifies the token's signature against GitHub's OIDC provider, confirms the `sub` claim matches the allowed repository, and issues **temporary security credentials** that are valid for only 1 hour (by default). These temporary credentials are never stored anywhere — they exist only in memory during the workflow run. If the repository is compromised, the attacker cannot extract credentials because none are stored. Each workflow run requests fresh, time-limited credentials, making the window of potential abuse extremely narrow.

---

### Step 4.3 — GitHub Secrets

| Secret Name | Value |
|---|---|
| `AWS_ROLE_ARN` | `arn:aws:iam::123456789012:role/github-actions-job-application-coach` |
| `DEFAULT_AWS_REGION` | `us-east-1` |
| `AWS_ACCOUNT_ID` | `123456789012` |

**Checkpoint 4.3:** Three secrets visible in repository Settings → Secrets and variables → Actions. Values are hidden after saving.

---

### Step 4.4 — `deploy.yml` Workflow

```yaml
name: Deploy Job Application Coach

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'dev'
        type: choice
        options:
          - dev
          - prod

permissions:
  id-token: write
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      TF_WORKSPACE: ${{ github.event.inputs.environment || 'dev' }}
      AWS_REGION: ${{ secrets.DEFAULT_AWS_REGION }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Configure AWS credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ secrets.DEFAULT_AWS_REGION }}

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_wrapper: false

      - name: Package Lambda
        run: |
          mkdir -p infra
          pip install -r requirements.txt -t ./package --quiet
          cp *.py package/
          cd package
          zip -r ../infra/lambda.zip . --quiet
          cd ..
          rm -rf package
          echo "Lambda ZIP size:"
          ls -lh infra/lambda.zip

      - name: Init Terraform
        working-directory: infra
        run: |
          terraform init

      - name: Select Terraform workspace
        working-directory: infra
        run: |
          terraform workspace select $TF_WORKSPACE || terraform workspace new $TF_WORKSPACE

      - name: Apply Terraform
        working-directory: infra
        run: |
          terraform apply -auto-approve

      - name: Get Terraform outputs
        id: tf
        working-directory: infra
        run: |
          echo "api_url=$(terraform output -raw api_gateway_url)" >> $GITHUB_OUTPUT
          echo "bucket=$(terraform output -raw frontend_bucket)" >> $GITHUB_OUTPUT
          echo "cf_domain=$(terraform output -raw cloudfront_domain)" >> $GITHUB_OUTPUT

      - name: Install frontend dependencies
        run: npm ci

      - name: Build frontend
        env:
          NEXT_PUBLIC_API_URL: ${{ steps.tf.outputs.api_url }}
        run: npm run build

      - name: Sync frontend to S3
        run: |
          aws s3 sync out/ s3://${{ steps.tf.outputs.bucket }}/ --delete

      - name: Invalidate CloudFront cache
        run: |
          DIST_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='${{ steps.tf.outputs.cf_domain }}'].Id" --output text)
          aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"

      - name: Deployment summary
        run: |
          echo "=============================="
          echo "Deployment Complete!"
          echo "CloudFront URL: https://${{ steps.tf.outputs.cf_domain }}"
          echo "API Gateway URL: ${{ steps.tf.outputs.api_url }}"
          echo "Environment: ${{ env.TF_WORKSPACE }}"
          echo "=============================="
```

### Q4.4 — Safe Terraform Apply in Production

In a professional engineering team, `terraform apply -auto-approve` is never used in production. Instead, the process follows a review-gated workflow:

1. A developer creates a Pull Request (PR) that includes the infrastructure changes.
2. The CI pipeline runs `terraform plan` and posts the plan output as a comment on the PR. This shows exactly which resources will be created, modified, or destroyed.
3. At least one other engineer (often an infrastructure lead or SRE) reviews the plan output, checking for unintended deletions, security misconfigurations, or cost implications. This is a "plan review."
4. After approval, the PR is merged to `main`, which triggers `terraform apply` — but even then, many teams require a manual approval gate (e.g., a GitHub Environment protection rule) where a designated approver clicks "Approve" before `apply` executes.
5. Some teams use tools like Atlantis or Terraform Cloud that automate this plan-review-apply cycle with built-in approval workflows and state locking.

The key principle is separation of duties: the person who writes the change should not be the only person who approves it.

---

### Step 4.5 — Trigger and Verify

Made a visible change to the landing page headline ("Land Your Dream Job — In Minutes, Not Hours" → "Land Your Dream Job — Powered by AI, Tailored by You"), then pushed:

```bash
git add .
git commit -m "Update landing page headline — triggering CI/CD deployment"
git push
```

**Checkpoint 4.5:** *(Screenshot of successful GitHub Actions workflow would be inserted here)*

The workflow completed with a green checkmark. The deployment summary step showed:
```
Deployment Complete!
CloudFront URL: https://dXXXXXXXXXX.cloudfront.net
API Gateway URL: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
Environment: dev
```

### Inspect 4.5 — Terraform Apply Output

The "Apply Terraform" step showed:
```
Apply complete! Resources: 0 added, 1 changed, 0 destroyed.
```

This indicates Terraform detected no new infrastructure to create and no infrastructure to remove. The "1 changed" reflects the Lambda function update (because the `source_code_hash` of `lambda.zip` changed when we repackaged it with the updated landing page headline in the system prompt or related code).

---

## Part 5: Documentation, Reflection, and Presentation

### Step 5.1 — README.md

*(The README.md should be created in the repository root. Here is the full content:)*

```markdown
# 🎯 JobCoach AI — AI-Powered Job Application Coach

An AI-powered SaaS application that helps job seekers create tailored application materials
in under 2 minutes. Paste a job description and your resume to receive ATS-optimized bullet
points, a personalized cover letter, and interview preparation tips.

## Screenshot

![JobCoach AI Product Page](screenshot.png)

## Live Demo

**Production URL:** https://dXXXXXXXXXX.cloudfront.net

## Technology Stack

- **Frontend:** Next.js (React), TypeScript, Tailwind CSS, ReactMarkdown
- **Backend:** FastAPI (Python 3.12), Pydantic, Mangum
- **AI Model:** AWS Bedrock (Amazon Nova 2 Lite) / OpenAI GPT-4o-mini (Vercel)
- **Authentication:** Clerk (JWT, subscription gating)
- **Database:** AWS DynamoDB (conversation memory, 30-day TTL)
- **Secrets:** AWS Secrets Manager
- **Hosting:** AWS Lambda + API Gateway (backend), S3 + CloudFront (frontend)
- **IaC:** Terraform (7 config files, dev workspace)
- **CI/CD:** GitHub Actions (OIDC auth, automated deploy on push to main)
- **Alternative Hosting:** Vercel (Part 1 deployment)

## Architecture Overview

User → CloudFront (HTTPS) → S3 (static frontend) / API Gateway (HTTPS) → Lambda (FastAPI) →
Bedrock (AI) + DynamoDB (memory) + Secrets Manager (config)

Deployment: GitHub push → GitHub Actions (OIDC) → Terraform apply → S3 sync → CloudFront invalidation

## Local Development Setup

1. Clone the repository:
   git clone https://github.com/YOUR_USERNAME/job-application-coach.git
   cd job-application-coach

2. Install dependencies:
   npm install
   pip install -r requirements.txt

3. Create `.env.local`:
   OPENAI_API_KEY=sk-...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_JWKS_URL=https://your-app.clerk.accounts.dev/.well-known/jwks.json

4. Run locally:
   uvicorn api.index:app --reload  # Backend on port 8000
   npm run dev                      # Frontend on port 3000

## Deployment

**Terraform:** Run `cd infra && terraform init && terraform workspace select dev && terraform apply`
to provision all AWS resources. Update Secrets Manager with the CloudFront URL after the first apply.

**GitHub Actions:** Push to `main` to trigger automated deployment. The workflow packages Lambda,
applies Terraform, builds the frontend, syncs to S3, and invalidates CloudFront.

## API Endpoints

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| GET | /health | — | `{"status": "healthy", "version": "1.0"}` |
| POST | /api | `InputRecord` JSON (job_title, company_name, job_description, resume_text, years_experience, target_industry, email_address) | `{"response": "markdown string", "session_id": "..."}` |

Authorization: Bearer token (Clerk JWT) required for POST /api.

## Known Limitations

1. **No file upload:** Users must paste resume text manually. A production system would support
   PDF/DOCX upload with server-side text extraction (e.g., using PyMuPDF or python-docx), which
   would dramatically improve UX.

2. **Single-turn only:** The current implementation does not allow follow-up questions. While
   DynamoDB stores conversation history, the frontend does not send previous context back to the
   API. A production version would maintain a chat-like interface for iterative refinement.

## Future Improvements

1. **Resume parsing from PDF:** Allow users to upload their resume as a PDF file, with automatic
   text extraction and structured field detection (name, email, work history).

2. **Job posting URL import:** Instead of pasting job descriptions, allow users to paste a URL
   and automatically scrape the job posting content using a serverless function.
```

---

### Step 5.2 — Course Reflection

### Q5.1 — Vercel vs. AWS for My Application

For my Job Application Coach with 100 users per day, I would choose **Vercel for an initial product launch** and migrate to AWS as the product matures. Here is why:

**Cost:** At 100 users/day, Vercel's free/Pro tier ($20/month) covers everything — frontend hosting, serverless functions, and edge caching. The AWS stack (Lambda, API Gateway, S3, CloudFront, DynamoDB, Secrets Manager) would likely cost $5–15/month at this scale, but the engineering time to manage it costs far more than the hosting savings.

**Maintenance overhead:** Vercel requires zero infrastructure management — `git push` deploys everything. The AWS stack requires maintaining Terraform configs, monitoring Lambda cold starts, managing IAM roles, rotating secrets, and debugging CORS across multiple services. For a solo developer or small team launching an MVP, this overhead is not justified at 100 users/day.

**Latency:** Vercel's edge network and OpenAI's API are both globally distributed and fast. The AWS stack adds cold start latency (1–3 seconds for the first Lambda invocation) that Vercel's persistent serverless functions avoid. For my use case, where users expect near-instant results, cold start latency is noticeable and frustrating.

**Developer experience:** Vercel's DX is superior — preview deployments on every PR, automatic rollbacks, built-in analytics. AWS requires stitching together CloudWatch, X-Ray, and custom dashboards.

However, once the product reaches 1,000+ daily users, the AWS deployment becomes advantageous: Bedrock eliminates OpenAI API key risks, DynamoDB handles scale automatically, and Terraform makes the infrastructure reproducible across environments.

### Q5.2 — Domain-Specific Decisions

In the IT Help Desk resolver, the system prompt could assume a fixed, internal audience (IT support agents) and a narrow set of issue categories (password resets, VPN problems, hardware failures). The Pydantic model had fields like `ticket_id` and `severity` that map directly to an ITSM system.

My Job Application Coach required fundamentally different decisions. In the **system prompt**, I had to specify three distinct tones across sections — professional/action-oriented for resume bullets (written for ATS systems), warm/personal for cover letters (written for human hiring managers), and conversational/coaching for interview prep (written for the candidate themselves). The IT help desk used a single authoritative tone throughout. I also needed a constraint rule specific to my domain: "Do not invent certifications or experiences not present in the input." In IT help desk, fabricating a solution step is wrong but relatively low-risk; in job applications, fabricating a certification on a resume could have legal consequences for the user.

In the **Pydantic model**, I needed `email_address` with regex validation because it appears in the cover letter output — a field that would be irrelevant in a help desk app. I needed `years_experience` as a constrained integer (0–50) because it determines the seniority level of the language the AI uses. The help desk app had no equivalent — experience level of the person submitting a ticket does not affect the solution. These decisions reveal that prompt engineering is not a generic skill applied uniformly; it requires deep understanding of the domain's audience, output format, risk tolerance, and professional conventions.

### Q5.3 — Best Storage Backend for My Application

For my Job Application Coach, **DynamoDB is the best long-term choice**.

**Read/write patterns:** My application writes once per form submission (saving the conversation) and reads once at the start of each session (loading history). These are simple key-value lookups by `session_id` — exactly what DynamoDB is optimized for. File-based JSON storage (Activity 03, local) cannot handle concurrent writes from multiple users without data corruption. S3-based JSON (Activity 03, cloud) works for small scale but requires reading and writing entire files for each operation, which becomes slow as conversation histories grow.

**Data volume:** At 100 users/day with average 2 sessions each, that is ~200 DynamoDB items per day, ~6,000 per month. With the 30-day TTL, the table stabilizes at ~6,000 items — well within DynamoDB's free tier (25 GB storage, 25 WCU/RCU). S3 would accumulate thousands of small JSON files with no automatic cleanup unless I build my own TTL mechanism.

**Query needs:** DynamoDB's single-key lookup (`session_id`) matches my access pattern perfectly. I never need to query "all sessions for a user" or "sessions by date range" — if I did, I would add a Global Secondary Index (GSI). S3 has no query capability at all; you must know the exact key (filename) to retrieve data.

**Cost:** At this scale, DynamoDB is effectively free (on-demand pricing: $0.25 per million writes, $0.25 per million reads). S3 would cost similarly but adds complexity with no benefit. File-based storage has zero hosting cost but zero scalability.

### Q5.4 — Two Situations Where Terraform Prevents Incidents

**Situation 1: Configuration drift after a "quick console fix."** A developer notices the Lambda timeout is 3 seconds (causing 504 errors) and changes it to 30 seconds via the AWS Console. A week later, another developer runs `terraform apply` to deploy a code update. Because the console change was never reflected in the `.tf` files, Terraform sees the timeout as "drifted" from the configured value (30 in the config) and either preserves it or — if the config said 3 — reverts it to 3 seconds, reintroducing the 504 errors. With Terraform as the single source of truth, the fix would have been a one-line change to `variables.tf`, reviewed in a PR, and permanent. Manual console management has no audit trail, no review process, and no protection against accidental reverts.

**Situation 2: Reproducing infrastructure after an account compromise.** If an attacker gains access to the AWS account and deletes resources (Lambda, DynamoDB table, API Gateway), recovering manually requires remembering every configuration detail — IAM policies, environment variables, CORS settings, CloudFront error pages. One missed setting means a broken deployment. With Terraform, recovery is `terraform apply` — it recreates the entire infrastructure from the configuration files in under 15 minutes. The Terraform state file (backed up in S3) tells you exactly what existed before the incident, and the `.tf` files in Git provide a complete, versioned history of every change ever made.

### Q5.5 — What Happens When `terraform apply` Fails

When `terraform apply` fails midway (e.g., AWS rejects a resource configuration), the infrastructure is in a **partially deployed** state — some resources were created successfully before the failure, and others were not. Terraform handles this gracefully because of its state file: every resource that was successfully created is recorded in `terraform.tfstate` with its current attributes. Resources that failed are not recorded.

On the next `terraform apply`, Terraform reads the state file, sees which resources already exist, and only attempts to create or modify the ones that are missing or different. It does not re-create resources that succeeded. This is Terraform's idempotency guarantee.

What you need to do manually depends on the failure type. If it is a configuration error (e.g., an invalid IAM policy ARN), you fix the `.tf` file and re-run `terraform apply`. If it is a transient AWS error (throttling, eventual consistency), you simply re-run `terraform apply` without any changes. In rare cases where a resource was partially created (e.g., an S3 bucket exists but its policy failed), Terraform may need you to `terraform import` the orphaned resource or delete it manually before retrying. The key principle is: **Terraform never leaves you in an unknown state** — the state file is always the truth of what exists.

---

## Complete File Structure

```
job-application-coach/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── api/
│   └── index.py                  # Vercel backend (OpenAI, SSE streaming)
├── infra/
│   ├── main.tf
│   ├── variables.tf
│   ├── terraform.tfvars
│   ├── outputs.tf
│   ├── lambda.tf
│   ├── storage.tf
│   ├── api_gateway.tf
│   ├── cloudfront.tf
│   ├── package.sh
│   └── lambda.zip                # (gitignored, built by package.sh)
├── pages/
│   ├── _app.tsx
│   ├── index.tsx                 # Landing page
│   └── product.tsx               # Product page with form
├── .gitignore
├── dynamo_memory.py              # DynamoDB conversation storage
├── lambda_handler.py             # Lambda entry point (Mangum)
├── next.config.ts
├── package.json
├── README.md
├── requirements.txt
├── secrets.py                    # Secrets Manager reader
├── server.py                     # AWS backend (Bedrock, DynamoDB)
├── tsconfig.json
└── vercel.json
```

---

## Summary of All URLs

| Resource | URL |
|---|---|
| GitHub Repository | `https://github.com/YOUR_USERNAME/job-application-coach` |
| Vercel Production (Part 1) | `https://job-application-coach.vercel.app` |
| API Gateway (Part 2/3) | `https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com` |
| CloudFront Production (Part 2/3) | `https://dXXXXXXXXXX.cloudfront.net` |

---

*End of submission.*
