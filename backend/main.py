from os import environ
from typing import Any, Dict, List
from fastapi import FastAPI, File, UploadFile
from fastapi.params import Body
from pydantic import BaseModel
import google.generativeai as genai
import json, re
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import vision
from google.cloud import aiplatform
# ---------------- Gemini Config ----------------
GEMINI_API_KEY = "AIzaSyC2nmIohYwFInD3eLgNPCJG-24BUPYO07o"
genai.configure(api_key=GEMINI_API_KEY)

# Choose model (Gemini Pro is best for text reasoning)
chat_model = genai.GenerativeModel("gemini-2.5-flash")

# ---------------- FastAPI App ----------------
app = FastAPI(
    title="Business Model Canvas API (Gemini)",
    description="Generates a Business Model Canvas JSON for a given project and department",
    version="1.0.0",
)


def clean_and_parse_json(raw_output: str):
    raw_output = re.sub(r"^```json|```$", "", raw_output, flags=re.MULTILINE).strip()
    return json.loads(raw_output)


# ✅ Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Request Schemas ----------------
class BMCRequest(BaseModel):
    project_name: str
    project_description: str
    sector: str
    funding_stage: str
    team_size: int
    project_document: str
    cost_structure: str = None
    revenue_potential: str = None


class HypothesisRequest(BaseModel):
    bmc_data: Dict[str, Any]
    project_description: str
    sector: str


class ExperimentRequest(BaseModel):
    hypotheses: List[Dict[str, Any]]
    project_description: str
    sector: str


# ---------------- Helper: Call Gemini ----------------
def call_gemini(prompt: str) -> str:
    response = chat_model.generate_content(prompt)
    return response.text.strip()


# ---------------- Endpoints ----------------
@app.post("/generate_bmc")
async def generate_bmc(request: BMCRequest):
    prompt = f"""
    You are an expert business consultant.
    Create a detailed Business Model Canvas for the following project idea.

    STRICTLY return only valid JSON (no explanations, no markdown, no extra text).
    The JSON must have these keys:
    key-partners, key-activities, key-resources, value-propositions,
    customer-relationships, channels, customer-segments, cost-structure, revenue-streams.
    - Each key must contain 3 to 5 concise items.
    - Ensure 'cost-structure' aligns with provided cost inputs.
    - Ensure 'revenue-streams' aligns with provided revenue potential.

    Sector: {request.sector}
    Project idea: {request.project_description}
    Funding stage: {request.funding_stage}
    Team size: {request.team_size}
    Project document: {request.project_document}
    Cost Structure (input): {request.cost_structure}
    Revenue Potential (input): {request.revenue_potential}
    """

    try:
        raw_output = call_gemini(prompt)
        raw_output = re.sub(
            r"^```json|```$", "", raw_output, flags=re.MULTILINE
        ).strip()
        bmc_data = json.loads(raw_output)
        return {"project_name": request.project_name, "business_model_canvas": bmc_data}
    except Exception as e:
        return {"error": str(e)}


@app.post("/generate_hypotheses")
async def generate_hypotheses(request: HypothesisRequest):
    bmc_summary = json.dumps(request.bmc_data, indent=2)
    prompt = f"""
    You are a business validation expert.

    Using the Business Model Canvas below, identify the riskiest assumptions and convert them into **4–6 precise, testable hypotheses**.

    Guidelines:
    - Base each hypothesis on a specific element of the canvas (e.g., Value Proposition, Customer Segment, Channels, Revenue Streams, Key Resources/Partners/Activities, Cost Structure).
    - Make every hypothesis discrete, measurable, and framed as a single statement that can be validated or invalidated.
    - Each must address one of the three risk types:
        • desirability (customers want it)
        • feasibility (we can build/deliver it)
        • viability (it can make money)
    - Assign a `risk_weight` (10–30) so the total equals **100%**, reflecting relative risk.
    - All hypotheses in the output are “AI Suggested” unless additional human entries are later added.

    Department: {request.sector}  
    Project: {request.project_description}

    Business Model Canvas:  
    {bmc_summary}

    STRICTLY return **only valid JSON** with this exact structure:
    {{
        "total_hypotheses": <number>,
        "ai_suggested": <number>,
        "human_added": <number>,
        "risk_weight_total": "100%",
        "hypotheses": [
            {{
                "category": "<Canvas category>",
                "hypothesis": "<specific, testable hypothesis>",
                "risk_weight": "<number_between_10_and_30>",
                "type": "AI Suggested",
                "ai_doable":"Yes" | "No",
            }}
        ]
    }}

    """

    try:
        raw_output = call_gemini(prompt)
        hypothesis_data = clean_and_parse_json(raw_output)

        # Fix totals
        total_hypotheses = len(hypothesis_data.get("hypotheses", []))
        ai_suggested = len(
            [
                h
                for h in hypothesis_data["hypotheses"]
                if h.get("type") == "AI Suggested"
            ]
        )
        ai_doable = (
            "Yes"
            if all(h.get("ai_doable") == "Yes" for h in hypothesis_data["hypotheses"])
            else "No"
        )
        human_added = total_hypotheses - ai_suggested
        hypothesis_data.update(
            {
                "total_hypotheses": total_hypotheses,
                "ai_suggested": ai_suggested,
                "human_added": human_added,
                "risk_weight_total": "100%",
                "ai_doable": ai_doable,
            }
        )

        return {
            "department": request.sector,
            "project": request.project_description,
            "hypothesis_data": hypothesis_data,
        }
    except Exception as e:
        return {"error": str(e)}


@app.post("/generate_experiments")
async def generate_experiments(request: ExperimentRequest):
    hypotheses_text = json.dumps(request.hypotheses, indent=2)
    prompt = f"""
        You are a startup experimentation expert.
        Based on these hypotheses, design discovery and validation experiments.

        Rules:
        - Draw experiments strictly from that experiment library (customer/problem interviews, surveys, search-trend analysis, smoke tests, landing pages, concierge/Wizard-of-Oz MVP, pre-sales, A/B tests, technical spikes, cost simulations, partner pilots, etc.).
        - Choose experiments that best reduce the riskiest hypotheses for this specific project.
        - Discovery experiments explore unknowns; Validation experiments generate measurable proof.
        - Link each experiment to its hypothesis and specify the risk type it reduces:
            - "desirability" (customers want it)
            - "feasibility" (we can build/deliver it)
            - "viability" (it can make money)
        - High `risk_weight` hypotheses = higher priority.
        - Each experiment must include cost estimate, runtime, success metric, and an AI confidence score (0–100%) for appropriateness.
        - Emphasize small, rapid, low-cost tests.
        Department: {request.sector}
        Project: {request.project_description}

        Hypotheses:
        {hypotheses_text}

        STRICTLY return valid JSON with this structure:
        {{
        "experiment_count": <number>,
        "experiments": [
            {{
            "hypothesis": "<linked_hypothesis>",
            "experiment_type": "Discovery" | "Validation",
            "ai_confidence": "<integer between 50-100>",
            "experiment_name": "<short_title>",
            "testing_statement": "<1 sentence describing what is being tested>",
            "measurement": "<1 phrase describing how it will be measured>",
            "description": "<2-3 sentence overview of how the experiment will run>",
            "cost_range": "<expected cost in USD less than 1000> not range",
            "runtime": "<expected duration in days or weeks>",
            "success_metric": "<quantitative measure of validation>",
            "priority": "<High/Medium/Low>"
            "ai_doable":"Yes" | "No",
            }}
        ]
        }}
        """
    try:
        raw_output = call_gemini(prompt)
        experiment_data = clean_and_parse_json(raw_output)
        return {
            "department": request.sector,
            "project": request.project_description,
            "experiment_data": experiment_data,
        }
    except Exception as e:
        return {"error": str(e)}
    

@app.post("/extract_text")
async def extract_text(file: UploadFile = File(...)):
    """
    Extract text from an uploaded image or PDF using Google Vision API.
    """
    contents = await file.read()
    client = vision.ImageAnnotatorClient()

    # For images
    image = vision.Image(content=contents)
    response = client.text_detection(image=image)
    texts = [text.description for text in response.text_annotations]

    # For PDFs, you would need to use asyncBatchAnnotateFiles (not shown here for brevity)

    if response.error.message:
        return {"error": response.error.message}

    return {"extracted_text": texts[0] if texts else ""}

@app.post("/vertex_hypothesis_test")
async def vertex_hypothesis_test(
    experiment_type: str = Body(..., embed=True),
    hypotheses: list = Body(..., embed=True)
):
    """
    Run hypothesis testing experiments using Google Vertex AI Agents.
    experiment_type: The type of experiment (e.g., 'text-generation', 'classification', etc.)
    hypotheses: List of hypothesis dicts to test.
    """
    try:
        aiplatform.init(project=environ["project_name"], location="us-central1")
        results = []
        for hypothesis in hypotheses:
            if experiment_type == "text-generation":
                model = aiplatform.TextGenerationModel.from_pretrained("text-bison@001")
                response = model.predict(hypothesis["prompt"])
                results.append({"hypothesis": hypothesis, "result": response.text})
            elif experiment_type == "classification":
                model = aiplatform.Model(environ["classification_model_id"])
                response = model.predict(hypothesis["instances"])
                results.append({"hypothesis": hypothesis, "result": response})
            else:
                results.append({"hypothesis": hypothesis, "error": "Unsupported experiment type."})
        return {"experiment_type": experiment_type, "results": results}
    except Exception as e:
        return {"error": str(e)}


# ---------------- Run the app ----------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
