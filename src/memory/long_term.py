import os
import chromadb
from chromadb.utils import embedding_functions

class LongTermMemory:
    def __init__(self, collection_name="gleidson_knowledge"):
        # Cria um banco de dados vetorial local na pasta 'chroma_db'
        self.persist_directory = "./chroma_db"
        os.makedirs(self.persist_directory, exist_ok=True)
        
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        
        # Usa um gerador de embeddings padrão e leve em português/inglés
        self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
        
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn
        )

    def add_document(self, doc_id: str, text: str, metadata: dict = None):
        """Adiciona um documento ou trecho de conhecimento à base do Gleidson"""
        self.collection.upsert(
            documents=[text],
            metadatas=[metadata or {}],
            ids=[doc_id]
        )

    def search_knowledge(self, query: str, n_results: int = 2) -> list:
        """Busca na memória documentos relevantes para responder à pergunta"""
        if self.collection.count() == 0:
            return []
            
        results = self.collection.query(
            query_texts=[query],
            n_results=min(n_results, self.collection.count())
        )
        
        # Retorna os textos encontrados
        documents = results.get("documents", [[]])[0]
        return documents

long_term_memory = LongTermMemory()