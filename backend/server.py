import asyncio
import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
from contextlib import asynccontextmanager

from scraper import TrawlScraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scraper: Optional[TrawlScraper] = None
scraper_lock = asyncio.Lock()


class ScrapeRequest(BaseModel):
    url: str
    mode: str = "single"
    depth: int = 2
    max_pages: int = 50
    scroll: bool = True
    extract: List[str] = ["links", "text", "structured"]


class BrandingRequest(BaseModel):
    url: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    global scraper
    scraper = TrawlScraper(headless=True)
    await scraper.start()
    logger.info("Scraper initialized")
    yield
    await scraper.stop()
    logger.info("Scraper cleaned up")


app = FastAPI(title="Trawl Scraper API", lifespan=lifespan)

progress_state = {
    "current": 0,
    "total": 0,
    "message": "",
    "pages": []
}


def progress_callback(data):
    progress_state.update(data)


@app.on_event("startup")
async def startup():
    global scraper
    scraper.progress_callback = progress_callback


@app.post("/scrape")
async def scrape(request: ScrapeRequest):
    global scraper

    if not request.url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")

    async with scraper_lock:
        try:
            result = await scraper.scrape(
                url=request.url,
                mode=request.mode,
                depth=request.depth,
                max_pages=request.max_pages,
                scroll=request.scroll,
                extract=request.extract
            )
            return result
        except Exception as e:
            logger.error(f"Scraping error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/status")
async def status():
    return progress_state


@app.post("/stop")
async def stop_scrape():
    global scraper
    if scraper and scraper.active:
        scraper.request_stop()
        return {"status": "stop requested"}
    return {"status": "no active scrape"}


@app.post("/branding")
async def extract_branding(request: BrandingRequest):
    global scraper
    if not request.url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")
    async with scraper_lock:
        try:
            result = await scraper.scrape(
                url=request.url,
                mode="single",
                max_pages=1,
                scroll=False,
                extract=["branding"]
            )
            branding = result["pages"][0]["branding"] if result["pages"] else {}
            return {"url": request.url, "branding": branding}
        except Exception as e:
            logger.error(f"Branding extraction error: {e}")
            raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5555, log_level="info")
