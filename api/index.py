import os
from fastapi import FastAPI, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI
from typing import Optional
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

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