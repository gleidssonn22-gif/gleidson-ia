from src.core.config import settings

class LLMRouter:
    def __init__(self):
        # Define as regras de escolha baseadas na complexidade ou tamanho da tarefa
        self.default_model = settings.DEFAULT_MODEL
        self.advanced_model = settings.ADVANCED_MODEL

    def route_query(self, query: str) -> str:
        query_lower = query.lower()
        
        # Palavras-chave que indicam tarefas mais complexas exigindo raciocínio pesado
        complex_keywords = ["código", "refatorar", "arquitetura", "algoritmo", "planejamento", "analise profunda"]
        
        if any(keyword in query_lower for keyword in complex_keywords) or len(query) > 400:
            return self.advanced_model
        
        # Para conversas comuns e respostas rápidas
        return self.default_model

llm_router = LLMRouter()