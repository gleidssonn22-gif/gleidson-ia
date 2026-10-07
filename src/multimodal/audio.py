import os
from google import genai
from google.genai import types
from src.core.config import settings

class AudioModule:
    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_name = settings.DEFAULT_MODEL

    def transcribe_and_analyze_audio(self, audio_file_path: str, prompt: str = "Transcreva este áudio detalhadamente e resuma os pontos principais.") -> str:
        """Envia um arquivo de áudio (MP3, WAV, etc.) para o Gemini analisar ou transcrever"""
        try:
            if not os.path.exists(audio_file_path):
                raise FileNotFoundError(f"Arquivo de áudio não encontrado: {audio_file_path}")

            with open(audio_file_path, "rb") as f:
                audio_bytes = f.read()

            ext = audio_file_path.lower().split('.')[-1]
            mime_map = {"mp3": "audio/mp3", "wav": "audio/wav", "ogg": "audio/ogg", "m4a": "audio/m4a"}
            mime_type = mime_map.get(ext, "audio/mp3")

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Part.from_bytes(
                        data=audio_bytes,
                        mime_type=mime_type,
                    ),
                    prompt
                ]
            )
            return response.text
        except Exception as e:
            raise RuntimeError(f"Erro ao processar áudio: {e}")

audio_module = AudioModule()