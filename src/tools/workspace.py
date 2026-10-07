from typing import Dict, Any, List
from src.tools.base import BaseTool

class WorkspaceTool(BaseTool):
    name = "workspace"
    description = "Gerencia tarefas e registros de produtividade do projeto."

    def __init__(self):
        self.tasks: List[str] = []

    def execute(self, action: str, task_name: str = "") -> Dict[str, Any]:
        """Executa ações de produtividade como adicionar ou listar tarefas"""
        action = action.lower()
        
        if action == "add":
            if task_name:
                self.tasks.append(task_name)
                return {"success": True, "message": f"Tarefa '{task_name}' adicionada com sucesso."}
            return {"success": False, "message": "Nome da tarefa não fornecido."}
            
        elif action == "list":
            return {"success": True, "tasks": self.tasks}
            
        return {"success": False, "message": f"Ação '{action}' desconhecida."}

workspace_tool = WorkspaceTool()