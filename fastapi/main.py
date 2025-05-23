from fastapi import FastAPI, Request, status, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse

app = FastAPI()

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
