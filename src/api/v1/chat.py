from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from src.core.agent import agent

router = APIRouter(prefix="/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str

@router.post("/")
def chat_endpoint(request: ChatRequest):
    try:
        response_text = agent.process_message(request.message)
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Processa a mensagem usando o agente do Gleidson
            response_text = agent.process_message(data)
            await websocket.send_text(response_text)
    except WebSocketDisconnect:
        print("Cliente desconectado do WebSocket do Gleidson.")