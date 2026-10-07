import os
from google import genai
from google.genai import types
from src.core.config import settings

class DocumentParserModule:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.DEFAULT_MODEL

    def analyze_pdf(self, pdf_file_path: str, prompt: str = "Faça um resumo completo deste documento e extraia os dados mais importantes.") -> str:
        """Envia um arquivo PDF diretamente para o Gemini analisar o conteúdo de texto e tabelas"""
        try:
            if not os.path.exists(pdf_file_path):
                raise FileNotFoundError(f"Arquivo PDF não encontrado: {pdf_file_path}")

            with open(pdf_file_path, "rb") as f:
                pdf_bytes = f.read()

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Part.from_bytes(
                        data=pdf_bytes,
                        mime_type="application/pdf",
                    ),
                    prompt
                ]
            )
            return response.text
        except Exception as e:
            raise RuntimeError(f"Erro ao processar o documento PDF: {e}")

document_parser = DocumentParserModule()