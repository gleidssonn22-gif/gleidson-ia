import redis
import json
from typing import List, Dict

class ShortTermMemory:
    def __init__(self, host='localhost', port=6379, db=0):
        try:
            # Conecta ao servidor Redis local (ou nuvem)
            self.client = redis.Redis(host=host, port=port, db=db, decode_responses=True)
            self.client.ping() # Testa a conexão
            self.connected = True
        except Exception:
            # Fallback caso o Redis não esteja rodando na máquina local (evita travar o app)
            self.connected = False
            self.memory_fallback: Dict[str, List] = {}

    def add_message(self, session_id: str, role: str, content: str):
        message = {"role": role, "content": content}
        if self.connected:
            # Salva a mensagem em uma lista no Redis (últimas interações)
            self.client.rpush(f"chat:{session_id}", json.dumps(message))
            # Mantém apenas as últimas 20 mensagens para não estourar a memória
            self.client.ltrim(f"chat:{session_id}", -20, -1)
        else:
            # Fallback em memória RAM se o Redis não estiver instalado
            if session_id not in self.memory_fallback:
                self.memory_fallback[session_id] = []
            self.memory_fallback[session_id].append(message)

    def get_history(self, session_id: str) -> List[Dict]:
        if self.connected:
            raw_messages = self.client.lrange(f"chat:{session_id}", 0, -1)
            return [json.loads(msg) for msg in raw_messages]
        else:
            return self.memory_fallback.get(session_id, [])

short_term_memory = ShortTermMemory()