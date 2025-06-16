from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

@app.get("api/test")
def test_endpoint():
    return {"message": "Hello from back-end!"}