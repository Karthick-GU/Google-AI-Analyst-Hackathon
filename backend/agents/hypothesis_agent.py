## Google Libraries
import json
import os
from google.adk.agents import LlmAgent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

APP_NAME = "ai_analyst"
USER_ID = "1234"
SESSION_ID = "session1234"

# --- Agent 2: Hypothesis Generator ---
hypothesis_agent = LlmAgent(
    name="HypothesisAgent",
    model="gemini-2.0-flash",
    instruction="""
    You are a business validation expert.

    You will receive the Business Model Canvas (BMC) JSON from the user message.
    Use ONLY the provided BMC JSON to generate hypotheses.

    Produce 4–6 discrete testable hypotheses. For each hypothesis include:
    - category: which BMC component it relates to
    - hypothesis: clear, testable statement
    - risk_weight: number from 10–30
    - type: "AI Suggested" | "Human Added"
    - ai_doable: "Yes" or "No"

    Additional strict requirement:
    - The SUM of all risk_weight values MUST be exactly 100. 
    Do NOT exceed 100 and do NOT go below 100.

    Return ONLY valid JSON with a top-level "hypotheses" array.
    No markdown, no commentary.
    """,
    description="Generates testable hypotheses from BMC",
    output_key="hypotheses_json",
)

def safe_load_json(s: str):
    """Safely parse JSON from LLM response."""
    s = s.strip()
    s = s.replace("```json", "").replace("```", "").strip()
    return json.loads(s)


async def hypotheses_main(bmc_data):
    session_service = InMemorySessionService()
    runner = Runner(
        agent=hypothesis_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    # Create session
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=SESSION_ID,
    )

    # Store into state (not required for LLM, but safe)
    session.state["bmc_json"] = bmc_data

    print("\nDEBUG: BMC stored in session state:\n", session.state.get("bmc_json"))

    # ---- FIXED: Pass BMC JSON explicitly to LLM ----
    llm_message = types.Content(
        role="user",
        parts=[
            types.Part(
                text=(
                    "Generate hypotheses ONLY using this BMC JSON:\n\n"
                    f"{json.dumps(bmc_data, indent=2)}"
                )
            )
        ],
    )

    # Stream the response
    final_event = None
    async for event in runner.run_async(
        user_id=session.user_id,
        session_id=session.id,
        new_message=llm_message,
    ):
        print("DEBUG EVENT:", event)
        if hasattr(event, "is_final_response") and event.is_final_response():
            final_event = event
            break

    # Extract raw LLM text
    raw = [part.text for part in final_event.content.parts]
    parsed = safe_load_json(raw[0])

    return parsed