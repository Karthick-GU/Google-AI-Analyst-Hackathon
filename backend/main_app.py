## Standard Libraries
import json
from os import environ
import re
from pydantic import BaseModel
from typing import Any, Dict, List
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware

## Google Libraries
from google.oauth2 import service_account
from google.cloud import vision, storage, bigquery

# from google import genai
from agents.bmc_agent import bmc_main
from agents.hypothesis_agent import hypotheses_main
from agents.experiments_agent import experiments_main

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
    bmc_data: List[Dict[str, Any]]
    project_id: int
    project_description: str
    sector: str


class ExperimentRequest(BaseModel):
    hypotheses: List[Dict[str, Any]]
    project_id: int
    project_description: str
    sector: str


credentials = service_account.Credentials.from_service_account_info(
    {
        "type": "service_account",
        "project_id": environ["PROJECT_ID_SA"],
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
def update_table(data, table_name):
    """Append one or more JSON-serializable rows to a BigQuery table.

    - `data` may be a dict (single row) or a list of dicts (multiple rows).
    - Dataset and table are taken from `environ` with sensible defaults.
    - The function will create the dataset/table if they don't exist.
    """

    client = bigquery.Client(
        project=environ["PROJECT_ID_SA"],
        credentials=credentials,
    )

    dataset_name = environ.get("BQ_DATASET")
    project_id = environ.get("PROJECT_ID_SA")
    dataset_id = f"{project_id}.{dataset_name}"
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

    # Prepare rows (stringify non-strings) and normalize field names
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

    all_errors = []

    # For each row: if project-id exists, UPDATE that row; else INSERT.
    for row in prepared:
        try:
            # Find a project id-like key in the row (e.g. project-id or project_id)
            proj_key = None
            for k in row.keys():
                lk = k.lower()
                if "project" in lk and "id" in lk:
                    proj_key = k
                    break

            # If no project id in payload, fall back to inserting the row
            if not proj_key:
                insert_errors = client.insert_rows_json(table_id, [row])
                if insert_errors:
                    all_errors.extend(insert_errors)
                continue

            proj_val = row.get(proj_key)

            # Check if a row with this project id already exists
            check_sql = f"SELECT COUNT(1) AS cnt FROM `{table_id}` WHERE `{proj_key}` = @proj_val"
            job_config = bigquery.QueryJobConfig(
                query_parameters=[
                    bigquery.ScalarQueryParameter("proj_val", "STRING", proj_val)
                ]
            )

            check_job = client.query(check_sql, job_config=job_config)
            check_result = list(check_job.result())
            exists = False
            if check_result and len(check_result) > 0:
                exists = int(check_result[0].cnt) > 0

            if exists:
                # Build an UPDATE statement with parameters for each field
                query_params = []
                set_clauses = []
                for k, v in row.items():
                    # sanitize parameter name (letters, digits, underscore)
                    pname = "p_" + re.sub(r"[^0-9a-zA-Z_]", "_", k)
                    set_clauses.append(f"`{k}` = @{pname}")
                    query_params.append(
                        bigquery.ScalarQueryParameter(pname, "STRING", v)
                    )

                # Ensure we have a parameter for the WHERE clause that matches the proj_key
                where_param_name = "p_where_proj_val"
                query_params.append(
                    bigquery.ScalarQueryParameter(where_param_name, "STRING", proj_val)
                )

                set_clause = ", ".join(set_clauses)
                update_sql = f"UPDATE `{table_id}` SET {set_clause} WHERE `{proj_key}` = @{where_param_name}"

                update_job = client.query(
                    update_sql,
                    job_config=bigquery.QueryJobConfig(query_parameters=query_params),
                )
                # force execution
                _ = list(update_job.result())

            else:
                # Insert new row
                insert_errors = client.insert_rows_json(table_id, [row])
                if insert_errors:
                    all_errors.extend(insert_errors)

        except Exception as e:
            all_errors.append({"row": row, "error": str(e)})

    if all_errors:
        return {"status": "error", "errors": all_errors}

    return {"status": "ok", "processed_rows": len(prepared)}


def get_data_from_table(table_name, project_id):
    """Retrieve rows from a BigQuery table filtered by project_id.

    - Dataset and table are taken from `environ` with sensible defaults.
    - Returns a list of rows as dictionaries.
    """

    client = bigquery.Client(
        project=environ["PROJECT_ID_SA"],
        credentials=credentials,
    )

    dataset_name = environ.get("BQ_DATASET")
    project_id_env = environ.get("PROJECT_ID_SA")
    dataset_id = f"{project_id_env}.{dataset_name}"
    table_id = f"{dataset_id}.{table_name}"
    if project_id is None:
        query_sql = f"SELECT * FROM `{table_id}`"
        job_config = None
    else:
        query_sql = f"SELECT * FROM `{table_id}` WHERE `project-id` = @project_id"
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("project_id", "STRING", str(project_id))
            ]
        )

    query_job = client.query(query_sql, job_config=job_config)
    results = query_job.result()

    rows = [dict(row) for row in results]
    return rows


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
            project=environ["PROJECT_ID_SA"],
            credentials=credentials,
        )
        bucket_name = environ.get("GCS_BUCKET", "hackathon-data-bucket-001")
        print(f"Uploaded bucket_name: {environ['PROJECT_ID_SA'],bucket_name}")
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
        return {
            "error": f"Failed to upload files: {str(e),environ['PROJECT_ID_SA'], bucket_name}"
        }


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
        f"gs://hackathon-data-bucket-001/{project_id}/{name.strip()}"
        for name in file_names_str.split(",")
        if name.strip()
    ]

    result = await run_bmc(file_paths=file_paths)

    ## Update table
    data = result.copy()
    data["project-id"] = str(project_id)
    project_details = {
        "project_name": request.project_name,
        "project_description": request.project_description,
        "sector": request.sector,
        "funding_stage": request.funding_stage,
        "team_size": request.team_size,
        "project_document": request.project_document,
        "cost_structure": request.cost_structure,
        "revenue_potential": request.revenue_potential,
        "project-id": str(project_id),
    }
    update_table(project_details, table_name="Projects")
    update_table(data, table_name="BMC")
    return result


@app.post("/run_hypotheses_agent")
async def generate_hypotheses_endpoint(request: HypothesisRequest):
    """Generate Hypotheses from BMC"""
    project_id = request.project_id
    if request.bmc_data is None or len(request.bmc_data) == 0:
        bmc_data = get_data_from_table("BMC", project_id)
        if bmc_data and len(bmc_data) > 0:
            bmc_json = bmc_data[0]
        else:
            return {"error": f"No BMC data found for project_id {project_id}"}
    else:
        bmc_json = request.bmc_data
    result = await hypotheses_main(bmc_json)
    ## Update table
    data = result.copy()
    data["project-id"] = str(project_id)
    update_table(data, table_name="Hypotheses")
    return result


@app.post("/run_experiments_agent")
async def generate_experiments_endpoint(request: ExperimentRequest):
    """Generate experiments from hypotheses."""
    try:
        project_id = request.project_id
        hypotheses_json = request.hypotheses
        if not hypotheses_json or len(hypotheses_json) == 0:
            hypotheses_data = get_data_from_table("Hypotheses", project_id)
            if hypotheses_data and len(hypotheses_data) > 0:
                hypotheses_json = hypotheses_data[0]
            else:
                return {
                    "error": f"No Hypotheses data found for project_id {project_id}"
                }

        result = await experiments_main(hypotheses_json)
        ## Update table
        data = result.copy()
        data["project-id"] = str(project_id)
        update_table(data, table_name="Experiments")
        return result

    except Exception as e:
        return {"error": f"Failed to generate experiments: {str(e)}"}


@app.post("/get_data")
async def get_data_endpoint(table_name: str, project_id: int):
    """Retrieve data from specified table for given project_id."""
    try:
        data = get_data_from_table(table_name, project_id)
        return {"data": data}
    except Exception as e:
        return {"error": f"Failed to retrieve data: {str(e)}"}

@app.get("/get_all_data")
async def get_all_data_endpoint():
    """Retrieve all data (BMC, Hypotheses, Experiments) for given project_id."""
    try:
        bmc_data = get_data_from_table("BMC", None)
        hypotheses_data = get_data_from_table("Hypotheses", None)
        experiments_data = get_data_from_table("Experiments", None)

        return {
            "bmc_data": bmc_data,
            "hypotheses_data": hypotheses_data,
            "experiments_data": experiments_data,
        }
    except Exception as e:
        return {"error": f"Failed to retrieve data: {str(e)}"}


@app.get("/get_all_project_data")
async def get_all_project_data_endpoint():
    """Retrieve all data (BMC, Hypotheses, Experiments) for given project_id."""
    try:
        ## Getting all project data
        projects_data = get_data_from_table("Projects", None)
        return {"projects_data": projects_data}

    except Exception as e:
        return {"error": f"Failed to retrieve data: {str(e)}"}

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
