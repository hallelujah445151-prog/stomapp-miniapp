from fastapi import FastAPI

app = FastAPI(title="Simple Test API")

@app.get("/")
async def root():
    return {"message": "Simple test API is running", "status": "ok"}

@app.get("/test")
async def test():
    return {"test": "success", "data": [1, 2, 3]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)