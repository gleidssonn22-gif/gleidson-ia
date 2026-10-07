import httpx

def testar_chat():
    url = "http://127.0.0.1:8000/chat/"
    payload = {
        "message": "Olá! Poderia verificar agora mesmo se o site clubewins.com.br está online e qual é o tempo de resposta?"
    }
    
    print("Enviando requisição para a API do Gleidson (aguardando a IA processar a ferramenta)...")
    
    try:
        # Aumentamos o timeout para 90 segundos para dar tempo da ferramenta rodar
        response = httpx.post(url, json=payload, timeout=90.0)
        print(f"Status HTTP retornado: {response.status_code}")
        
        print("\n--- Resposta Completa da API ---")
        print(response.json())
        print("--------------------------------")
        
    except Exception as e:
        print(f"Erro ao conectar: {e}")

if __name__ == "__main__":
    testar_chat()