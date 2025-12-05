from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from pathlib import Path
import dotenv
import io
import base64
from rembg import remove
from PIL import Image
import requests as req_lib
# Load .env located next to this file and override any empty/placeholder envs
dotenv.load_dotenv(dotenv_path=Path(__file__).with_name(".env"), override=True)


from llm.scenario import ScenarioVideoGenerator, ScenarioImageGenerator
from llm.prompt import get_prompt, get_card_prompt, get_ball_caller_prompt

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


class CardGenerateRequest(BaseModel):
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


def remove_background_from_url(image_url: str) -> Optional[str]:
    """
    Download image from URL, remove background, and return as base64 data URL.
    Returns None if processing fails.
    """
    try:
        # Download the image
        response = req_lib.get(image_url, timeout=30)
        response.raise_for_status()
        
        # Open image with PIL
        input_image = Image.open(io.BytesIO(response.content))
        
        # Remove background using rembg
        output_image = remove(input_image)
        
        # Convert to PNG bytes
        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format='PNG')
        output_buffer.seek(0)
        
        # Convert to base64 data URL
        image_base64 = base64.b64encode(output_buffer.read()).decode('utf-8')
        data_url = f"data:image/png;base64,{image_base64}"
        
        return data_url
    except Exception as e:
        print(f"Background removal failed: {e}")
        return None


@app.post("/scenario/generate-card")
def generate_card_image(req: CardGenerateRequest):
    api_key = os.getenv("SCENARIO_ID") or os.getenv("SCENARIO_API_KEY") or "YOUR_API_KEY"
    api_secret = os.getenv("SCENARIO_SECRET") or os.getenv("SCENARIO_API_SECRET") or "YOUR_API_SECRET"

    if api_key == "YOUR_API_KEY" or api_secret == "YOUR_API_SECRET":
        raise HTTPException(status_code=500, detail="Scenario API credentials are not set in environment variables.")

    client = ScenarioImageGenerator(api_key=api_key, api_secret=api_secret)

    try:
        prompt_text = get_card_prompt(req.theme)
        data = client.generate_image(prompt=prompt_text, aspect_ratio="9:16", resolution="1K")
        if not data:
            raise HTTPException(status_code=502, detail="Failed to generate card image.")

        job = data.get("job") or {}
        asset_ids = (job.get("metadata") or {}).get("assetIds", [])

        asset_urls: List[str] = []
        processed_urls: List[str] = []
        
        for aid in asset_ids:
            try:
                url = client.get_asset_url(aid)
                if url:
                    asset_urls.append(url)
                    
                    # Remove background from the generated card
                    print(f"Removing background from card image...")
                    bg_removed_url = remove_background_from_url(url)
                    
                    if bg_removed_url:
                        processed_urls.append(bg_removed_url)
                        print(f"Background removed successfully!")
                    else:
                        # Fallback to original if background removal fails
                        processed_urls.append(url)
                        print(f"Background removal failed, using original image")
            except Exception as e:
                print(f"Error processing asset {aid}: {e}")
                pass

        return {
            "job": job,
            "asset_ids": asset_ids,
            "asset_urls": processed_urls if processed_urls else asset_urls,  # Use processed URLs with bg removed
            "original_urls": asset_urls,  # Keep original URLs as backup
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class BallCallerGenerateRequest(BaseModel):
    theme: str


@app.post("/scenario/generate-ball-caller")
def generate_ball_caller_image(req: BallCallerGenerateRequest):
    api_key = os.getenv("SCENARIO_ID") or os.getenv("SCENARIO_API_KEY") or "YOUR_API_KEY"
    api_secret = os.getenv("SCENARIO_SECRET") or os.getenv("SCENARIO_API_SECRET") or "YOUR_API_SECRET"

    if api_key == "YOUR_API_KEY" or api_secret == "YOUR_API_SECRET":
        raise HTTPException(status_code=500, detail="Scenario API credentials are not set in environment variables.")

    client = ScenarioImageGenerator(api_key=api_key, api_secret=api_secret)

    try:
        prompt_text = get_ball_caller_prompt(req.theme)
        print(f"Generating ball caller with prompt: {prompt_text}")
        
        # Use 16:9 aspect ratio for the elongated capsule shape
        data = client.generate_image(prompt=prompt_text, aspect_ratio="16:9", resolution="1K")
        if not data:
            raise HTTPException(status_code=502, detail="Failed to generate ball caller image.")

        job = data.get("job") or {}
        asset_ids = (job.get("metadata") or {}).get("assetIds", [])

        asset_urls: List[str] = []
        processed_urls: List[str] = []
        
        for aid in asset_ids:
            try:
                url = client.get_asset_url(aid)
                if url:
                    asset_urls.append(url)
                    
                    # Remove background from the generated ball caller
                    print(f"Removing background from ball caller image...")
                    bg_removed_url = remove_background_from_url(url)
                    
                    if bg_removed_url:
                        processed_urls.append(bg_removed_url)
                        print(f"Background removed successfully!")
                    else:
                        # Fallback to original if background removal fails
                        processed_urls.append(url)
                        print(f"Background removal failed, using original image")
            except Exception as e:
                print(f"Error processing asset {aid}: {e}")
                pass

        return {
            "job": job,
            "asset_ids": asset_ids,
            "asset_urls": processed_urls if processed_urls else asset_urls,
            "original_urls": asset_urls,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
