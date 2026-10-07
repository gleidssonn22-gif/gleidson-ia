import os
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from google import genai
from google.genai import errors

from src.database import engine, Base, get_db
from src.models import MensagemChat
from src.tools import verificar_status_clubewins

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gleidson AI - Clubewins API", version="1.1")

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

class ChatRequest(BaseModel):
    message: str

@app.post("/chat/")
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        system_instruction = (
            "Você é o assistente oficial inteligente do ecossistema clubewins.com.br. "
            "Você tem acesso à ferramenta 'verificar_status_clubewins'. "
            "Sempre que o usuário perguntar sobre o status ou saúde do site, chame essa ferramenta."
        )
        
        response = client.models.generate_content(
            model='gemini-3.8-flash',
            contents=request.message,
            config={
                'system_instruction': system_instruction,
                'temperature': 0.3,
                'tools': [verificar_status_clubewins]
            }
        )
        
        resposta_texto = response.text

        nova_interacao = MensagemChat(
            user_message=request.message,
            agent_response=resposta_texto
        )
        db.add(nova_interacao)
        db.commit()
        db.refresh(nova_interacao)

        return {
            "status": "success",
            "id_historico": nova_interacao.id,
            "response": resposta_texto
        }

    except errors.APIError as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Erro ao processar a solicitação com o Gemini: {e}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Erro interno no servidor: {str(e)}"
        )

@app.get("/historico/")
def listar_historico(db: Session = Depends(get_db)):
    historico = db.query(MensagemChat).order_by(MensagemChat.created_at.desc()).all()
    return {
        "total_conversas": len(historico),
        "historico": [
            {
                "id": h.id,
                "pergunta": h.user_message,
                "resposta": h.agent_response,
                "data": h.created_at
            } for h in historico
        ]
    }