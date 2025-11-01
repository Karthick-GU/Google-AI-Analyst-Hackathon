## Standard Libraries
import os
import json
from pathlib import Path
from pydantic import BaseModel
from typing import Any, Dict, List
from fastapi import FastAPI, File, Request, UploadFile, Body, Form
from fastapi.middleware.cors import CORSMiddleware

## Google Libraries
from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.sessions import InMemorySessionService
import google.generativeai as generativeai
from google.adk.runners import Runner
from google.cloud import vision, storage, bigquery
from google.genai import types
from google.oauth2 import service_account

# from google import genai
from agents.bmc_agent import bmc_main
from agents.hypothesis_agent import hypotheses_main
from agents.experiments_agent import experiments_main

environ = {
    "PROJECT_ID": "agentic-ai-388410",
    "GCS_BUCKET": "agentic-ai-data-hackathon",
    "OCR_PROCESSOR_ID": "a9323d8299a0bf44",
    "BQ_DATASET": "startup_dataset",
    "BQ_TABLE": "bmc_table",
}

## Configurations
GEMINI_API_KEY = "AIzaSyC2nmIohYwFInD3eLgNPCJG-24BUPYO07o"
os.environ["GOOGLE_API_KEY"] = "AIzaSyC2nmIohYwFInD3eLgNPCJG-24BUPYO07o"
generativeai.configure(api_key=GEMINI_API_KEY)

# Choose model (Gemini Pro is best for text reasoning)
chat_model = generativeai.GenerativeModel("gemini-2.5-flash")


## FastAPI App Initialization
app = FastAPI(title="ADK BMC Pipeline", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Request models ----------
class BMCRequest(BaseModel):
    project_id: int
    project_name: str
    project_description: str
    sector: str
    funding_stage: str
    team_size: int
    project_document: str
    cost_structure: str = None
    revenue_potential: str = None
    file_names: str


class HypothesisRequest(BaseModel):
    bmc_data: Dict[str, Any]
    project_description: str
    sector: str


class ExperimentRequest(BaseModel):
    hypotheses: List[Dict[str, Any]]
    project_description: str
    sector: str


# ---------- Utility: JSON sanitizer ----------
def safe_load_json(s: str):
    """Safely parse JSON from LLM response, removing markdown wrappers."""
    s = s.strip()
    # remove triple-backtick wrappers if present
    s = s.replace("```json", "").replace("```", "").strip()
    return json.loads(s)


# ================= Helper Functions =================
def update_bmc_table(data):
    """Append one or more JSON-serializable rows to a BigQuery table.

    - `data` may be a dict (single row) or a list of dicts (multiple rows).
    - Dataset and table are taken from `environ` with sensible defaults.
    - The function will create the dataset/table if they don't exist.
    """
    credentials = service_account.Credentials.from_service_account_file(
        str(Path(__file__).parent / "credentials.json")
    )

    client = bigquery.Client(
        project=environ["PROJECT_ID"],
        credentials=credentials,
    )

    dataset_name = environ.get("BQ_DATASET", "bmc")
    table_name = environ.get("BQ_TABLE", "bmc_results")
    dataset_id = f"agentic-ai-analyst.{dataset_name}"
    table_id = f"{dataset_id}.{table_name}"

    # Normalize rows to a list
    rows = data if isinstance(data, list) else [data]

    # Ensure dataset exists
    try:
        client.get_dataset(dataset_id)
    except Exception:
        dataset = bigquery.Dataset(dataset_id)
        client.create_dataset(dataset, exists_ok=True)

    # Ensure table exists (derive simple STRING schema from first row)
    try:
        client.get_table(table_id)
    except Exception:
        schema = []
        if rows and isinstance(rows[0], dict):
            for k in rows[0].keys():
                field_name = str(k).replace(".", "_")
                schema.append(bigquery.SchemaField(field_name, "STRING"))
        else:
            schema = [bigquery.SchemaField("json_payload", "STRING")]

        table = bigquery.Table(table_id, schema=schema)
        client.create_table(table)

    # Prepare rows for insertion (stringify non-strings)
    prepared = []
    for r in rows:
        if isinstance(r, dict):
            prepared.append(
                {
                    k.replace(".", "_"): json.dumps(v) if not isinstance(v, str) else v
                    for k, v in r.items()
                }
            )
        else:
            prepared.append({"json_payload": json.dumps(r)})

    errors = client.insert_rows_json(table_id, prepared)
    if errors:
        return {"status": "error", "errors": errors}

    return {"status": "ok", "inserted_rows": len(prepared)}


# ================= Pipeline Runner =================


async def run_bmc(file_paths: List[str]) -> Dict[str, Any]:
    """
    Execute the complete sequential pipeline.
    Returns BMC, hypotheses, and experiments.
    """

    # bmc_main expects a file_urls string (comma-separated). Join the incoming paths.
    urls_arg = ",".join(file_paths) if isinstance(file_paths, list) else file_paths
    result = await bmc_main(file_urls=urls_arg)

    return result


# ================= Vision API Integration =================


def vision_extract_text(file_bytes: bytes, mime_type: str) -> str:
    """Extract text from images or PDFs using Google Vision API."""
    try:
        creds = service_account.Credentials.from_service_account_file(
            str(Path(__file__).parent / "credentials.json")
        )
        client = vision.ImageAnnotatorClient(credentials=creds)

        if mime_type == "application/pdf":
            image = vision.Image(content=file_bytes)
            response = client.document_text_detection(image=image)
        else:
            image = vision.Image(content=file_bytes)
            response = client.text_detection(image=image)

        if response.error.message:
            raise Exception(f"Vision API error: {response.error.message}")

        if response.full_text_annotation:
            return response.full_text_annotation.text
        elif response.text_annotations:
            return response.text_annotations[0].description
        else:
            return ""

    except Exception as e:
        return f"Error extracting text: {str(e)}"


# ================= FastAPI Endpoints =================


@app.get("/")
async def root():
    return {
        "message": "ADK BMC Pipeline API",
        "status": "active",
        "version": "1.0.0",
        "endpoints": [
            "/generate_bmc",
            "/generate_hypotheses",
            "/generate_experiments",
            "/run_full_pipeline",
            "/extract_text",
        ],
    }


@app.post("/file_upload")
async def upload_file_to_bucket(
    project_id: str = Form(...), files: List[UploadFile] = File(...)
):
    """Upload one or more files to the GCS bucket under a folder named by project_id.

    Expects form-data with:
    - project_id: str
    - files: one or more files

    Returns JSON with uploaded gs:// URIs.
    """
    try:

        credentials = service_account.Credentials.from_service_account_file(
            str(Path(__file__).parent / "credentials.json")
        )

        storage_client = storage.Client(
            project=environ["PROJECT_ID"],
            credentials=credentials,
        )
        bucket_name = os.environ.get("GCS_BUCKET", "agentic-ai-data-hackathon")
        bucket = storage_client.bucket(bucket_name)

        uploaded = []
        for upload in files:
            contents = await upload.read()
            blob_name = f"{project_id}/{upload.filename}"
            blob = bucket.blob(blob_name)
            # Use upload_from_string so we can handle UploadFile bytes
            blob.upload_from_string(contents, content_type=upload.content_type)
            uploaded.append(f"gs://{bucket_name}/{blob_name}")

        return {"uploaded": uploaded}

    except Exception as e:
        return {"error": f"Failed to upload files: {str(e)}"}


@app.post("/run_bmc_pipeline")
async def run_bmc_pipeline_endpoint(request: BMCRequest):
    """Run the GenAIContentAgent + BMC pipeline on the provided file path(s).

    Accepts a JSON body matching `BMCRequest` (FastAPI will parse it into the model).
    """
    # Use the Pydantic model fields directly
    project_id = request.project_id
    # request.file_names is expected as comma-separated names
    file_names_str = request.file_names
    file_paths = [
        f"gs://agentic-ai-data-hackathon/{project_id}/{name.strip()}"
        for name in file_names_str.split(",")
        if name.strip()
    ]

    result = await run_bmc(file_paths=file_paths)

    ## Update table
    data = result.copy()
    data["project-id"] = str(project_id)
    update_bmc_table(data)
    return result


@app.post("/run_hypotheses_agent")
async def generate_hypotheses_endpoint(request: HypothesisRequest):
    """Generate Hypotheses from BMC"""
    bmc_json = request.bmc_data
    result = await hypotheses_main(bmc_json)
    return result


@app.post("/run_experiments_agent")
async def generate_experiments_endpoint(request: ExperimentRequest):
    """Generate experiments from hypotheses."""
    try:
        bmc_json = request.hypotheses
        result = await experiments_main(bmc_json)

        return result

    except Exception as e:
        return {"error": f"Failed to generate experiments: {str(e)}"}


@app.post("/extract_text")
async def extract_text_endpoint(file: UploadFile = File(...)):
    """Extract text from uploaded image or PDF using Vision API."""
    try:
        contents = await file.read()
        extracted_text = vision_extract_text(contents, file.content_type)
        return {
            "filename": file.filename,
            "extracted_text": extracted_text,
            "content_type": file.content_type,
        }
    except Exception as e:
        return {"error": f"Failed to extract text: {str(e)}"}


# # ---------- Run locally ----------
# if __name__ == "__main__":
#     import uvicorn

#     uvicorn.run(app, host="0.0.0.0", port=8000)
