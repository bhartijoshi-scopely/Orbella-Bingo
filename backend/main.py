from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from pathlib import Path
import dotenv
# Load .env located next to this file and override any empty/placeholder envs
dotenv.load_dotenv(dotenv_path=Path(__file__).with_name(".env"), override=True)


from llm.scenario import ScenarioVideoGenerator
from llm.prompt import get_prompt

app = FastAPI(title="Orbella Bingo - Scenario API")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    # Frontend will only send theme
    theme: str


@app.get("/")
def root():
    return {"status": "ok"}


@app.post("/scenario/generate")
def generate_video(req: GenerateRequest):
    api_key = os.getenv("SCENARIO_ID") or os.getenv("SCENARIO_API_KEY") or "YOUR_API_KEY"
    api_secret = os.getenv("SCENARIO_SECRET") or os.getenv("SCENARIO_API_SECRET") or "YOUR_API_SECRET"

    if api_key == "YOUR_API_KEY" or api_secret == "YOUR_API_SECRET":
        raise HTTPException(status_code=500, detail="Scenario API credentials are not set in environment variables.")

    client = ScenarioVideoGenerator(
        api_key=api_key,
        api_secret=api_secret,
        model_id="model_veo3-1",
        resolution="1080p",
    )

    try:
        prompt_text = get_prompt(req.theme)
        data = client.generate_video(
            prompt=prompt_text,
            generate_audio=False,
            aspect_ratio="16:9",
            duration=8,
        )
        if not data:
            raise HTTPException(status_code=502, detail="Failed to generate video.")

        job = data.get("job") or {}
        asset_ids = (job.get("metadata") or {}).get("assetIds", [])
        # Try to resolve directly playable URLs for convenience
        asset_urls: List[str] = []
        for aid in asset_ids:
            try:
                url = client.get_asset_url(aid)
                if url:
                    asset_urls.append(url)
            except Exception:
                pass

        downloaded_paths: List[str] = []
        # Optional: enable download via query flag in future if needed
        if False and asset_ids:
            project_root = os.path.dirname(__file__)
            out_dir = os.path.join(project_root, "video")
            os.makedirs(out_dir, exist_ok=True)
            for aid in asset_ids:
                path = client.download_asset(aid, out_dir)
                if path:
                    downloaded_paths.append(path)

        return {
            "job": job,
            "asset_ids": asset_ids,
            "asset_urls": asset_urls,
            "downloaded": downloaded_paths,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
