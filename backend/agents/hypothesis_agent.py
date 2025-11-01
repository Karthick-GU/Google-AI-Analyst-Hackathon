## Google Libraries
import json
import os
from google.adk.agents import LlmAgent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

os.environ["GOOGLE_API_KEY"] = "AIzaSyC2nmIohYwFInD3eLgNPCJG-24BUPYO07o"
APP_NAME = "ai_analyst"
USER_ID = "1234"
SESSION_ID = "session1234"
# --- Agent 2: Hypothesis Generator ---
hypothesis_agent = LlmAgent(
    name="HypothesisAgent",
    model="gemini-2.0-flash",
    instruction="""
    You are a business validation expert.
    The BMC JSON is available in the state as 'bmc_json'.

    Generate 4-6 discrete testable hypotheses. For each hypothesis provide:
    - category: which BMC component it relates to
    - hypothesis: clear, testable statement
    - risk_weight: number from 10-30 (higher = more critical)
    - type: "desirability", "feasibility", or "viability"
    - ai_doable: "Yes" or "No"

    Return ONLY valid JSON with a "hypotheses" array. No markdown, no commentary.
    """,
    description="Generates testable hypotheses from BMC",
    output_key="hypotheses_json",
)

def safe_load_json(s: str):
    """Safely parse JSON from LLM response, removing markdown wrappers."""
    s = s.strip()
    # remove triple-backtick wrappers if present
    s = s.replace("```json", "").replace("```", "").strip()
    return json.loads(s)


async def hypotheses_main(bmc_data):
    session_service = InMemorySessionService()
    runner = Runner(
        agent=hypothesis_agent, app_name=APP_NAME, session_service=session_service
    )

    session = await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )

    session.state["bmc_json"] = bmc_data

    # runner.run returns an async generator of events — iterate it instead of awaiting
    async for event in runner.run_async(
        user_id=session.user_id,
        session_id=session.id,
        new_message=types.Content(
            role="user",
            parts=[
                types.Part(text=f"Generate Hypothesis.")
            ],
        ),
    ):
        print("DEBUG EVENT:", event)
        if (
            hasattr(event, "is_final_response")
            and event.is_final_response()
            and getattr(event, "content", None)
        ):
            break

    raw = [part.text for part in event.content.parts]
    parsed = safe_load_json(raw[0])

    return parsed
