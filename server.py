import os
import boto3
import json
from fastapi import FastAPI, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from dynamo_memory import load_conversation, save_conversation
from app_secrets import get_secret

app = FastAPI()
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)

# CORS Configuration
USE_DYNAMODB = os.getenv("USE_DYNAMODB", "false").lower() == "true"

if USE_DYNAMODB:
    config = get_secret(os.getenv("SECRET_NAME", "job-application-coach/config-dev"))
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


# Data Model 
class InputRecord(BaseModel):
    job_title: str = Field(..., min_length=2)
    company_name: str = Field(..., min_length=2)
    job_description: str = Field(..., min_length=50)
    resume_text: str = Field(..., min_length=50)
    years_experience: int = Field(..., ge=0, le=50)
    target_industry: str = Field(default="General")
    session_id: Optional[str] = None


#  System Prompt 
system_prompt = """You are an expert Career Coach and Resume Strategist with over 15 years of experience in talent acquisition, HR consulting, and professional development across multiple industries. You have deep expertise in applicant tracking systems (ATS), modern hiring practices, and persuasive professional writing. Your role is to help job seekers maximise their chances of landing interviews by producing targeted, high-quality application materials.

When given a job description and a candidate's resume, you must produce exactly three sections using the Markdown headings specified below. Do not add extra sections or deviate from the prescribed structure.

## Tailored Resume Bullet Points
Analyse the job description to identify the top 5-7 requirements and qualifications. For each, generate a resume bullet point that maps the candidate's experience to that requirement. Use strong action verbs (e.g., 'Spearheaded', 'Optimised', 'Delivered'). Include quantified achievements wherever the resume provides data. If the candidate lacks direct experience for a requirement, suggest a transferable skill framed positively. Format each bullet as a single concise sentence. Adopt a professional, concise tone suitable for a polished resume.

## Cover Letter Draft
Write a complete cover letter of 250-350 words addressed to the hiring manager at the specified company. The opening paragraph must include a compelling hook that references the company or role specifically — never use generic openings like 'I am writing to apply.' The body paragraphs should weave together the candidate's most relevant experience with the role's key requirements, demonstrating genuine fit rather than simply listing skills. The closing paragraph should include a confident call to action. Adopt a warm yet professional and persuasive tone.

## Interview Preparation Tips
Generate 5-7 likely interview questions that a hiring manager for this specific role would ask, based on the job description. For each question, provide a brief suggested talking point (2-3 sentences) that draws on the candidate's resume. Additionally, identify at least one potential weak spot or gap in the candidate's profile relative to the job requirements and suggest a strategy for addressing it confidently during the interview. Adopt an encouraging, coaching tone — like a supportive mentor preparing the candidate.

Constraints:
- Do not invent facts, achievements, or experiences not present in the candidate's resume.
- Do not fabricate company-specific details not provided in the job description.
- If the resume lacks quantified results, suggest where the candidate could add metrics but do not fabricate numbers.
- Keep all output in English unless the user explicitly requests another language.
- Never include discriminatory, biased, or inappropriate content."""


#User Prompt Builder 
def user_prompt_for(record: InputRecord) -> str:
    return (
        f"Job Title: {record.job_title}\n"
        f"Company: {record.company_name}\n"
        f"Target Industry: {record.target_industry}\n"
        f"Years of Experience: {record.years_experience}\n\n"
        f"--- Job Description ---\n{record.job_description}\n\n"
        f"--- Candidate Resume ---\n{record.resume_text}"
    )


#Health Endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0"}


# Main API Endpoint 
@app.post("/api")
def process(
    record: InputRecord,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    user_id = creds.decoded["sub"]
    session_id = record.session_id if record.session_id else user_id

    # Load conversation history
    conversation = load_conversation(session_id) if USE_DYNAMODB else []

    # Call AWS Bedrock
    bedrock = boto3.client(
        service_name="bedrock-runtime",
        region_name=os.getenv("BEDROCK_REGION", "us-east-1")
    )

    response = bedrock.converse(
        modelId=os.getenv("BEDROCK_MODEL_ID", "global.amazon.nova-2-lite-v1:0"),
        system=[{"text": system_prompt}],
        messages=[{"role": "user", "content": [{"text": user_prompt_for(record)}]}],
    )

    assistant_response = response["output"]["message"]["content"][0]["text"]

    # Save conversation history
    conversation.append({"role": "user", "content": user_prompt_for(record)})
    conversation.append({"role": "assistant", "content": assistant_response})
    if USE_DYNAMODB:
        save_conversation(session_id, conversation)

    return JSONResponse(content={"response": assistant_response, "session_id": session_id})