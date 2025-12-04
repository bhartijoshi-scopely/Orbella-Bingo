import os
import time
import requests

class ScenarioVideoGenerator:
    def __init__(self, api_key: str, api_secret: str, model_id: str = "model_veo3-1", resolution: str = "1080p"):
        self.api_key = api_key
        self.api_secret = api_secret
        self.model_id = model_id
        self.generate_url = f"https://api.cloud.scenario.com/v1/generate/custom/{self.model_id}"
        self.jobs_base_url = "https://api.cloud.scenario.com/v1/jobs"
        self.resolution = resolution
        self.assets_base_url = "https://api.cloud.scenario.com/v1/assets"

    def start_generation(self, prompt: str, generate_audio: bool = True, aspect_ratio: str = "16:9", duration: int = 8):
        payload = {
            "prompt": prompt,
            "generateAudio": generate_audio,
            "aspectRatio": aspect_ratio,
            "duration": duration,
            "resolution": self.resolution,
        }
        print("Initiating video generation...")
        r = requests.post(self.generate_url, headers={"Content-Type": "application/json"}, json=payload, auth=(self.api_key, self.api_secret))
        if r.status_code == 200:
            data = r.json()
            job = data.get("job") or {}
            job_id = job.get("jobId")
            if job_id:
                print(f"Video generation job initiated. Job ID: {job_id}")
                return job_id
            print("Error: No jobId returned in the initial response.")
            return None
        print(f"Error initiating video generation: {r.status_code} - {r.text}")
        return None

    def poll_job(self, job_id: str):
        polling_url = f"{self.jobs_base_url}/{job_id}"
        status = "queued"
        while status not in ["success", "failure", "canceled"]:
            print(f"Polling job {job_id}... Current status: {status}")
            time.sleep(3)
            resp = requests.get(polling_url, auth=(self.api_key, self.api_secret))
            if resp.status_code == 200:
                data = resp.json()
                job = data.get("job") or {}
                status = job.get("status")
                progress = (job.get("progress") or 0) * 100
                print(f"Progress: {progress:.2f}%")
                if status == "success":
                    asset_ids = (job.get("metadata") or {}).get("assetIds", [])
                    print(f"Video generation completed! Asset IDs: {asset_ids}")
                    return data
                if status in ["failure", "canceled"]:
                    print(f"Video generation failed or canceled: {job.get('error')}")
                    return data
            else:
                print(f"Error polling job status: {resp.status_code} - {resp.text}")
                return None
        return None

    def download_asset(self, asset_id: str, dest_dir: str):
        os.makedirs(dest_dir, exist_ok=True)
        # 1) Try direct download endpoint
        download_url = f"{self.assets_base_url}/{asset_id}/download"
        resp = requests.get(download_url, auth=(self.api_key, self.api_secret), stream=True)
        if resp.status_code == 200:
            ctype = (resp.headers.get("Content-Type") or "").lower()
            ext = ".mp4" if "mp4" in ctype else ".webm" if "webm" in ctype else ".mov" if "quicktime" in ctype else ".bin"
            out_path = os.path.join(dest_dir, f"{asset_id}{ext}")
            with open(out_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            print(f"Saved: {out_path}")
            return out_path

        # 2) Fallback: fetch metadata to get a signed URL
        meta_url = f"{self.assets_base_url}/{asset_id}"
        meta = requests.get(meta_url, auth=(self.api_key, self.api_secret))
        if meta.status_code == 200:
            data = meta.json()
            # Try common fields where a URL may appear
            candidates = []
            for key in ("downloadUrl", "url", "signedUrl"):
                if isinstance(data, dict) and data.get(key):
                    candidates.append(data.get(key))
            for node_key in ("asset", "data", "result", "file"):
                node = data.get(node_key) if isinstance(data, dict) else None
                if isinstance(node, dict):
                    for key in ("downloadUrl", "url", "signedUrl"):
                        if node.get(key):
                            candidates.append(node.get(key))
            for file_url in candidates:
                try:
                    r2 = requests.get(file_url, stream=True)
                    if r2.status_code == 200:
                        ctype = (r2.headers.get("Content-Type") or "").lower()
                        ext = ".mp4" if "mp4" in ctype else ".webm" if "webm" in ctype else ".mov" if "quicktime" in ctype else ".bin"
                        out_path = os.path.join(dest_dir, f"{asset_id}{ext}")
                        with open(out_path, "wb") as f:
                            for chunk in r2.iter_content(chunk_size=8192):
                                if chunk:
                                    f.write(chunk)
                        print(f"Saved: {out_path}")
                        return out_path
                except Exception as e:
                    print(f"Download via signed URL failed: {e}")
        else:
            print(f"Failed to fetch asset metadata: {meta.status_code} - {meta.text}")
        print(f"Unable to download asset {asset_id}")
        return None

    def get_asset_url(self, asset_id: str):
        """
        Try to fetch a directly usable URL for the given asset. Returns None if not found.
        """
        # Prefer direct download endpoint if it responds with a redirect or content
        download_url = f"{self.assets_base_url}/{asset_id}/download"
        try:
            head = requests.head(download_url, auth=(self.api_key, self.api_secret), allow_redirects=True)
            if head.status_code in (200, 302, 303) and head.headers.get('Location'):
                return head.headers['Location']
            if head.status_code == 200:
                return download_url
        except Exception:
            pass

        # Fallback: fetch metadata to get a signed URL
        meta_url = f"{self.assets_base_url}/{asset_id}"
        meta = requests.get(meta_url, auth=(self.api_key, self.api_secret))
        if meta.status_code == 200:
            data = meta.json()
            candidates = []
            for key in ("downloadUrl", "url", "signedUrl"):
                if isinstance(data, dict) and data.get(key):
                    candidates.append(data.get(key))
            for node_key in ("asset", "data", "result", "file"):
                node = data.get(node_key) if isinstance(data, dict) else None
                if isinstance(node, dict):
                    for key in ("downloadUrl", "url", "signedUrl"):
                        if node.get(key):
                            candidates.append(node.get(key))
            for u in candidates:
                if isinstance(u, str) and u.startswith("http"):
                    return u
        return None

    def generate_video(self, prompt: str, generate_audio: bool = True, aspect_ratio: str = "16:9", duration: int = 8):
        job_id = self.start_generation(prompt=prompt, generate_audio=generate_audio, aspect_ratio=aspect_ratio, duration=duration)
        if not job_id:
            return None
        return self.poll_job(job_id)