import json
import hashlib
from typing import Optional, Any
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel
import redis.asyncio as redis
import numpy as np
import logfire

app = FastAPI()
redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)
logfire.configure(service_name="fastapi")
logfire.instrument_fastapi(app)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder({"detail": exc.errors(), "body": exc.body}),
    )

@app.get("/health")
def health_check():
    return {"status": "OK"}

@app.get("/coffee")
def get_coffee():
    raise HTTPException(status_code=418)

@app.get("/", include_in_schema=False)
async def docs_redirect():
    return RedirectResponse(url='/docs')

class CompletionRequest(BaseModel):
    model: Optional[str] = "gpt-3.5-turbo"
    messages: list
    stop: Optional[Any] = None
    # max_tokens: Optional[int] = 7

class EmbeddingsRequest(BaseModel):
    model: Optional[str] = "text-embedding-3-small"
    input: str


@app.post("/completions")
async def create_completions(req: CompletionRequest):
    hashed = hashlib.sha256(
        json.dumps({
            'messages': req.messages,
            'stop': req.stop,
            # 'max_tokens': req.max_tokens,
        }, sort_keys=True).encode()
    ).hexdigest()
    cache_key = f"comp:{req.model}:{hashed}"

    cached = await redis_client.get(cache_key)
    if cached:
        cached_content = json.loads(cached)
        if cached_content is None:
            return JSONResponse(
                content={"content": ""},
                status_code=200
            )
        return JSONResponse(
            content={"content": cached_content},
            status_code=200
        )

    client = OpenAI()
    try:
        response = client.chat.completions.create(
            model=req.model,
            messages=req.messages,
            stop=req.stop if req.stop else None,
            # max_tokens=req.max_tokens,
            # temperature=0
        )
        print(response)
        if response.choices and len(response.choices) > 0:
            content = response.choices[0].message.content or ""
        else:
            content = "No response generated"

        if content:
            await redis_client.set(cache_key, json.dumps(content))

        return JSONResponse(
            content={"content": content},
            status_code=201
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/embeddings")
async def get_embeddings(req: EmbeddingsRequest):
    hashed = hashlib.sha256(
        json.dumps(req.input, sort_keys=True).encode()
    ).hexdigest()
    cache_key = f"emb:{req.model}:{hashed}"

    cached = await redis_client.get(cache_key)
    if cached:
        return JSONResponse(
            content=[{"embedding": json.loads(cached)}],
            status_code=200
        )

    client = OpenAI()
    try:
        response = client.embeddings.create(
            model=req.model,
            input=req.input,
            encoding_format="float"
        )
        embedding = response.data[0].embedding

        await redis_client.set(cache_key, json.dumps(embedding))

        return JSONResponse(
            content=[{"embedding": embedding}],
            status_code=201
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


