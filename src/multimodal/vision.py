import os
from google import genai
from google.genai import types
from src.core.config import settings

class VisionModule:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.DEFAULT_MODEL

    def analyze_image(self, image_path_or_bytes, prompt: str = "Descreva detalhadamente esta imagem e extraia todo o texto visível (OCR).") -> str:
        """Analisa uma imagem local ou em bytes usando o Gemini"""
        try:
            # Se for um caminho de arquivo local, abre em bytes
            if isinstance(image_path_or_bytes, str):
                if not os.path.exists(image_path_or_bytes):
                    raise FileNotFoundError(f"Arquivo de imagem não encontrado: {image_path_or_bytes}")
                
                with open(image_path_or_bytes, "rb") as f:
                    image_bytes = f.read()
                
                # Detecta a extensão para definir o tipo mime correto
                ext = image_path_or_bytes.lower().split('.')[-1]
                mime_map = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp"}
                mime_type = mime_map.get(ext, "image/jpeg")
            else:
                image_bytes = image_path_or_bytes
                mime_type = "image/jpeg"

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=mime_type,
                    ),
                    prompt
                ]
            )
            return response.text
        except Exception as e:
            raise RuntimeError(f"Erro ao processar visão computacional: {e}")

vision_module = VisionModule()