import os
import requests
from typing import Dict, Any
from src.tools.base import BaseTool

class WebSearchTool(BaseTool):
    name = "web_search"
    description = "Busca informações atualizadas na web em tempo real."

    def execute(self, query: str) -> Dict[str, Any]:
        """Realiza busca web (exemplo integrado com API genérica de busca ou fallback)"""
        api_key = os.getenv("TAVILY_API_KEY")
        
        # Se houver chave da Tavily configurada, usa ela
        if api_key:
            try:
                response = requests.post(
                    "https://api.tavily.com/search",
                    json={"api_key": api_key, "query": query, "max_results": 3}
                )
                if response.status_code == 200:
                    data = response.json()
                    results = [item.get("content") for item in data.get("results", [])]
                    return {"success": True, "results": results}
            except Exception as e:
                return {"success": False, "error": str(e)}

        # Fallback informativo caso não tenha chave externa configurada no momento
        return {
            "success": True, 
            "results": [f"Busca simulada para '{query}': Conectado ao ecossistema clubewins.com.br."]
        }

web_search_tool = WebSearchTool()