# Gleidson IA

O projeto contém uma API FastAPI com Gemini e SQLite, além do chat estático publicado pelo Cloudflare Worker.

## Executar a API localmente

Requer Python 3.10 ou mais recente. Na pasta do projeto, crie e ative um ambiente virtual, instale as dependências e configure a chave do Gemini:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -e .
Copy-Item .env.example .env
```

Defina `GEMINI_API_KEY` no arquivo `.env` e inicie a API:

```powershell
uvicorn src.main:app --reload
```

A API estará em `http://localhost:8000`; a documentação interativa fica em `/docs`. O histórico é salvo localmente em SQLite. A rota `/historico/` só fica disponível quando `API_HISTORY_TOKEN` estiver configurado; envie-o como token Bearer.

## Executar com Docker

Configure `GEMINI_API_KEY` no `.env` e execute:

```powershell
docker compose up --build
```

A API ficará disponível na porta 8000. O `.dockerignore` evita copiar credenciais, bancos locais e ambientes virtuais para a imagem.

## Chat do site

O chat é servido pelo Cloudflare Worker em `worker/index.js`. Configure `GEMINI_API_KEY` como secret do Worker antes do deploy. A publicação automatizada usa os secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` no GitHub Actions.
