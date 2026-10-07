from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseTool(ABC):
    name: str
    description: str

    @abstractmethod
    def execute(self, *args, **kwargs) -> Dict[str, Any]:
        """Executa a lógica da ferramenta e retorna um dicionário com o resultado."""
        pass