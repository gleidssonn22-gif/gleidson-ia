from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from src.database import Base

class MensagemChat(Base):
    __tablename__ = "mensagens_chat"

    id = Column(Integer, primary_key=True, index=True)
    user_message = Column(Text, nullable=False)
    agent_response = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)