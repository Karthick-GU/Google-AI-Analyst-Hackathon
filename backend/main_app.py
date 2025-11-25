## Standard Libraries
import os
import json
from os import environ
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

# environ = {
#     "PROJECT_ID": "agentic-ai-388410",
#     "GCS_BUCKET": "agentic-ai-data-hackathon",
#     "OCR_PROCESSOR_ID": "a9323d8299a0bf44",
#     "BQ_DATASET": "startup_dataset",
#     "BQ_TABLE": "bmc_table",
# }

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


# os.environ = {
#     "PROJECT_ID": "agentic-ai-analyst",
#     "PRIVATE_KEY_ID": "cbeea718d6d6bf3b495428b9be715c29368b4d20",
#     "PRIVATE_KEY": f"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC9LSMOmj+6E9IB\nna5J4knRyRjIbTiKdzQKE6kvlzYrSF/EIKC0mSrJvXBMtogaM4v8mYgIzp0W7q+S\niyKSHu0SYe8O6FYYh06vPH3y1aZCqSYnMndhwfFrOpSznvx+CyphM19ZKoF4aoED\nDnygVus9o+FIglFeHaaSYt9hgdyNrFubbR8Iy5LQJRwcHJHE9jYHJzJOB36paWpI\nx2MMohV9VqPzfl5tyQ8hKAqdMJCjgvzzRWAvTTYnmTPH/3ShfV8MuWErJNgS4XBZ\nBRR1ALcrqfVIPilA1cfWjBzUyzu5Q/wmygS7jIzFOf/7sJscvWY3xiuTxAM75rmq\nvj/m/5UxAgMBAAECggEAKAB9Yz8WrqA2TgUrr4/cEDI3vVnrFMx0ApV5twiAedKJ\n/Yzwrn+c3p/iOTZ3vSKdPUKx0zrtWMYL9i7ZlpBXjQWMaViTrAggiUl/UHQA/iOK\nX8t6Fv/NruDqRLkfpv9xbLBSPyaPzginUyAjFjyK7bPTlWOJFR+r81RY6+Nr4cDs\n40/spetnsYEVJg6ojR/vn2QO15GM79kpMfUqyzCAN8kZdi2Vawzm+n2NzAl9poKp\nhj14gtv9oLMQeVHIRLHnbq7PCiGSbAWjF6lDWsoPqwFjSgR4pxxVC2oVac6jB3Ae\nifwVZdCWSbnZvU0qkKm8tA3XOqngt+O3pl1SFujB4QKBgQD0Mx1+uXXCbDQ/Moyq\nshXeI0OQiR97GCQgimudd3+rHQuQhmCxDYa/uHeXJ7z7jrjuZTpP7/CjT0Dw8T2y\nN963N9Fh8LwT/zETEKzgq52GRjzGgBnWM5AOOTk/kT8FezTCwid4ZTDJ++ZYLJL1\np1DnidmMKMVHdqoYARHURs2tXQKBgQDGUVo7AaLthiz2WOJt23wrH7X/xGG+AkmE\ngRhUx4FN4qbmqSvMUz+Acp4xvTbPyeTErsvMOTgivNgSulctZl2EY7Lfny/lQxb6\n8eJJzjz672HoocvTco+A8Z0vSU90+cMBMjEihn/kcEixPvjZtCcfI/UPSBjwkiHa\nodwlf2h15QKBgQDwpCZeqNf4vbRGysN/unp+KvX7yoSxQrrnLkCaLhYrQzYQN7u0\n/gVZjKic1dYPdzeaBTsPZv0VkZYHWVNY+mGI34KAJ0DP29w6U2ZpB/T1SuW9HqNX\nR/yfZ5iYocMe3ajCe511sRIBGTCGl3ZCiZzabidpTQwLPk6j1PoC27r3KQKBgQC0\n6wRgriZ/f5dHCWFPjRqikKRM90+fsqB04/xZY0Of1PQjmxMcrJlSyb1tbMszFmC/\n2SKMZWrDrfmEZEAhZ7BKlVVaUfO0t9agCchBQoc4+Ocd/XRfqrQlksWtnLiC41M1\npR9T+tVzhcebAvKsUIAcFYZ7cW9nEDkYJe8aujeGzQKBgAmsyCfjvU7WKqtSl2jB\nDXNi9/J9p3sStxKoxBmDMtbHC7w/c8UibGLsrwbQzjMLGF5/QKpL8+wivsFq755f\nibJc8jMtdopC7eeUhEgLgrvcDwboBBc9iISk7DRTRkoEVMNQmbK98/DKQ6O47m+a\n4tYh4fl+WeAzp5djRI2Sbi/c\n-----END PRIVATE KEY-----\n",
#     "CLIENT_EMAIL": "hackathon@agentic-ai-analyst.iam.gserviceaccount.com",
#     "CLIENT_ID": "114830137231418297486",
#     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
#     "CLIENT_X509_CERT_URL": f"https://www.googleapis.com/robot/v1/metadata/x509/hackathon%40agentic-ai-analyst.iam.gserviceaccount.com",
#     # "universe_domain": "googleapis.com",
# }


credentials = service_account.Credentials.from_service_account_info(
    {
        "type": "service_account",
        "project_id": environ["PROJECT_ID"],
        "private_key_id": environ["PRIVATE_KEY_ID"],
        "private_key": environ["PRIVATE_KEY"].replace("\\n", "\n"),
        "client_email": environ["CLIENT_EMAIL"],
        "client_id": environ["CLIENT_ID"],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": environ["CLIENT_X509_CERT_URL"],
    }
)


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
        client = vision.ImageAnnotatorClient(credentials=credentials)

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


# ---------- Run locally ----------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
