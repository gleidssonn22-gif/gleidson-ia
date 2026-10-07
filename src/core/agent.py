from google import genai
from src.core.config import settings
from src.core.llm_router import llm_router
from src.core.security import security_guardrails

class GleidsonAgent:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            raise ValueError("A chave GEMINI_API_KEY não foi configurada.")
        
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def process_message(self, user_message: str) -> str:
        # 1. Validação de Segurança
        is_safe, error_message = security_guardrails.validate_input(user_message)
        if not is_safe:
            return f"⚠️ {error_message}"

        # 2. Roteamento Inteligente (Escolhe o melhor modelo para a tarefa)
        selected_model = llm_router.route_query(user_message)

        try:
            # 3. Geração da resposta usando a API oficial do Google Gemini
            system_instruction = "Você é o Gleidson, um assistente de IA avançado do ecossistema clubewins.com.br. Responda em português do Brasil de forma clara e prestativa."
            
            response = self.client.models.generate_content(
                model=selected_model,
                contents=f"{system_instruction}\n\nUsuário: {user_message}",
            )
            return response.text
        except Exception as e:
            raise RuntimeError(f"Erro ao processar a solicitação com o Gemini: {e}")

# Instância global pronta para ser usada no FastAPI
agent = GleidsonAgent()