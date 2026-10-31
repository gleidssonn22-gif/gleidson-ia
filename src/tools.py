import time
import httpx

def verificar_status_clubewins() -> dict:
    """Verifica a resposta do site público e da API local."""
    url_publica = "https://clubewins.com.br"
    url_local = "http://127.0.0.1:8000/"

    def check_url(url: str) -> tuple[str, float]:
        started_at = time.perf_counter()
        try:
            response = httpx.get(url, timeout=5.0, follow_redirects=True)
            elapsed_ms = round((time.perf_counter() - started_at) * 1000, 2)
            if response.is_success:
                return f"Online (HTTP {response.status_code})", elapsed_ms
            return f"Resposta com erro (HTTP {response.status_code})", elapsed_ms
        except httpx.TimeoutException:
            return "Sem resposta (tempo limite excedido)", round((time.perf_counter() - started_at) * 1000, 2)
        except httpx.RequestError:
            return "Indisponível (falha de conexão)", round((time.perf_counter() - started_at) * 1000, 2)

    public_status, public_time_ms = check_url(url_publica)
    local_status, local_time_ms = check_url(url_local)

    return {
        "projeto": "Clube Wins (clubewins.com.br)",
        "status_publico": public_status,
        "servidor_local": local_status,
        "tempo_resposta_publico_ms": public_time_ms,
        "tempo_resposta_local_ms": local_time_ms,
        "mensagem": "O diagnóstico consulta o site público e a API local neste momento; ele não confirma serviços internos nem disponibilidade futura."
    }
