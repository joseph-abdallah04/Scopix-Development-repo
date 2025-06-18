from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI()

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    # Optional: Save file
    with open(f"uploads/{file.filename}", "wb") as f:
        content = await file.read()
        f.write(content)

    return JSONResponse(content={"filename": file.filename, "content_type": file.content_type})