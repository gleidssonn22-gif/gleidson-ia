# Usa a imagem oficial e leve do Python
FROM python:3.11-slim

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia o arquivo de dependências para dentro do container
COPY requirements.txt .

# Instala as dependências do projeto
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo o resto do código do Gleidson para dentro do container
COPY . .

# Expõe a porta da API FastAPI
EXPOSE 8000

# Inicia a aplicação que existe no pacote src
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
