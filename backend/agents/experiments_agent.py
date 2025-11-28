## Google Libraries
import json
from google.adk.agents import LlmAgent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

APP_NAME = "ai_analyst"
USER_ID = "1234"
SESSION_ID = "session1234"

# --- Agent 2: Experiment Designer ---
experiment_agent = LlmAgent(
    name="ExperimentAgent",
    model="gemini-2.0-flash",
    instruction="""
    You are an experimentation designer.
    
    You will receive the hypotheses JSON from the user message.
    Use ONLY these hypotheses to design experiments.

    For each hypothesis, design a practical experiment with:
    - hypothesis: the hypothesis being tested
    - experiment_type: "Discovery" or "Validation"
    - ai_confidence: number from 50-100
    - experiment_name: short descriptive name
    - testing_statement: what specifically you're testing
    - measurement: how success is measured
    - description: detailed experiment steps (2-3 sentences)
    - cost_range: estimated cost (e.g., "$0-100", "$100-500")
    - runtime: estimated time (e.g., "1-2 weeks")
    - success_metric: specific metric and target
    - priority: "High", "Medium", or "Low"
    - ai_doable: "Yes" or "No"

    Return ONLY valid JSON with an "experiments" array.
    No markdown, no commentary.
    """,
    description="Designs experiments to test hypotheses",
    output_key="experiments_json",
)


def safe_load_json(s: str):
    """Safely parse JSON from LLM response, removing markdown wrappers."""
    s = s.strip()
    s = s.replace("```json", "").replace("```", "").strip()
    return json.loads(s)


async def experiments_main(hypotheses_data):
    session_service = InMemorySessionService()
    runner = Runner(
        agent=experiment_agent,
        app_name=APP_NAME,
        session_service=session_service,
    )

    # Create session
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=USER_ID,
        session_id=SESSION_ID,
    )

    # Save hypotheses into state (not used by LLM directly)
    session.state["hypotheses_json"] = hypotheses_data

    print("\nDEBUG: Hypotheses stored in session state:\n",
          session.state.get("hypotheses_json"))

    # ---- FIXED: Pass hypotheses JSON explicitly to LLM ----
    llm_message = types.Content(
        role="user",
        parts=[
            types.Part(
                text=(
                    "Generate experiments ONLY using these hypotheses:\n\n"
                    f"{json.dumps(hypotheses_data, indent=2)}"
                )
            )
        ],
    )

    # Stream LLM events
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

    raw = [part.text for part in final_event.content.parts]
    parsed = safe_load_json(raw[0])

    return parsed