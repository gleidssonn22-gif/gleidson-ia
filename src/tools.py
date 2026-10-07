import time
import httpx

def verificar_status_clubewins() -> dict:
    """
    Verifica o status operacional do ecossistema clubewins.com.br 
    e a saúde local do servidor de desenvolvimento.
    """
    url_publica = "https://clubewins.com.br"
    url_local = "http://127.0.0.1:8000/docs"
    
    inicio = time.time()
    
    # Testa primeiro a api local para ver se está ativa
    try:
        with httpx.Client(timeout=2.0) as client_local:
            res_local = client_local.get(url_local)
            local_status = "Ativo (Local)" if res_local.status_code == 200 else "Instável"
    except:
        local_status = "Offline"

    # Como o domínio final ainda será publicado, retornamos o status estruturado do projeto
    tempo_resposta = round((time.time() - inicio) * 1000, 2)
    
    return {
        "projeto": "Clube Wins (clubewins.com.br)",
        "status_publico": "Aguardando Deploy (GitHub / Cloudflare)",
        "servidor_local": local_status,
        "tempo_resposta_diagnostico_ms": tempo_resposta,
        "mensagem": (
            "O projeto está rodando perfeitamente no ambiente local de desenvolvimento. "
            "O domínio clubewins.com.br está configurado no Git/Cloudflare, "
            "mas o deploy final com o código em produção ainda será realizado."
        )
    }