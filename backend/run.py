from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from pathlib import Path

from core.config import CONFIG
from routers import (
    shapley_router,
    clustering_router,
    dataset_router
)

def create_app() -> FastAPI:
    app = FastAPI(
        title=CONFIG.API_TITLE,
        version=CONFIG.API_VERSION,
        description=CONFIG.API_DESCRIPTION,
        max_request_size=CONFIG.MAX_REQUEST_SIZE
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # TODO: Configure this
        # allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # index page
    BASE_DIR = Path(__file__).resolve().parent
    templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

    # static files
    app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

    @app.get("/", response_class=HTMLResponse)
    async def root(request: Request):
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "title": CONFIG.API_TITLE,
                "version": CONFIG.API_VERSION,
            }
        )

    # adding routers
    app.include_router(shapley_router)
    app.include_router(clustering_router)
    app.include_router(dataset_router)

    return app

app = create_app()
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "run:app", 
        host=CONFIG.HOST, 
        port=CONFIG.PORT, 
        reload=True  # auto-reload on code changes
    )
