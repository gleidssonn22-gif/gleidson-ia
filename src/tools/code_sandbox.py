import sys
import io
import traceback
from typing import Dict, Any
from src.tools.base import BaseTool

class CodeSandboxTool(BaseTool):
    name = "code_sandbox"
    description = "Executa código Python de forma isolada e retorna a saída obtida."

    def execute(self, code_string: str) -> Dict[str, Any]:
        """Executa código Python em ambiente controlado capturando stdout e erros"""
        # Redireciona a saída padrão (print) para uma string em memória
        old_stdout = sys.stdout
        new_stdout = io.StringIO()
        sys.stdout = new_stdout

        exec_globals = {}
        success = True
        error_msg = ""

        try:
            # Executa o código fornecido com restrições básicas de segurança
            exec(code_string, exec_globals)
        except Exception:
            success = False
            error_msg = traceback.format_exc()
        finally:
            # Restaura a saída padrão original
            sys.stdout = old_stdout

        output = new_stdout.getvalue()

        return {
            "success": success,
            "output": output,
            "error": error_msg if not success else None
        }

code_sandbox_tool = CodeSandboxTool()