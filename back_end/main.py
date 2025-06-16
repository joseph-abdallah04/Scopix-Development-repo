from fastapi import FastAPI

app = FastAPI()

@app.get("/api/test")
def test_endpoint():
    return {"message": "Hello from back-end!"}