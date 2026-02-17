import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any

# Third-party imports
try:
    import chromadb
    from chromadb.config import Settings
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("Please install required packages: pip install chromadb sentence-transformers")
    exit(1)

class RAGSystem:
    def __init__(self, collection_name: str = "devcore_rag"):
        """Initialize the RAG system with embedding model and vector store."""
        print("Initializing RAG System...")
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chroma_client = chromadb.Client(Settings(
            anonymized_telemetry=False
        ))
        self.collection = self.chroma_client.get_or_create_collection(name=collection_name)
        self.data: List[Dict] = []
        print("RAG System Initialized.")

    def load_data(self, file_path: str):
        """Load data from the JSON file."""
        print(f"Loading data from {file_path}...")
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                self.data = json.load(f)
            print(f"Loaded {len(self.data)} messages.")
        except FileNotFoundError:
            print(f"Error: File not found at {file_path}")
            return
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON format in {file_path}")
            return

    def build_vector_store(self):
        """Process data and store vectors in the local vector store."""
        if not self.data:
            print("No data loaded. Call load_data() first.")
            return

        print("Building vector store... This may take a while.")
        
        ids = []
        documents = []
        metadatas = []
        embeddings = []

        # Batch processing recommended for large datasets
        batch_size = 100 
        
        for i, msg in enumerate(self.data):
            # Skip empty messages or system messages if strictly not wanted in index (though requirement says retrieve only if requested)
            # We index everything but filter at query time? 
            # Or index everything so we CAN filter.
            
            if not msg.get('message'):
                continue
                
            text = f"{msg.get('sender', 'Unknown')}: {msg.get('message', '')}"
            meta = {
                "sender": msg.get('sender') or "Unknown",
                "timestamp": msg.get('timestamp') or "",
                "is_system": msg.get('is_system', False),
                "original_id": msg.get('id')
            }
            
            ids.append(str(msg['id']))
            documents.append(text)
            metadatas.append(meta)
            
            # Generate embedding
            # Note: chroma can generate embeddings automatically if we don't provide them, 
            # but we want to be explicit or match the requirement "Use embeddings".
            # For speed in this prototype, let's generate them in batches or let Chroma do it if we configured an embedding function.
            # But here we initialized SentenceTransformer manually.
            
        # Compute embeddings in batches
        total = len(documents)
        for i in range(0, total, batch_size):
            batch_docs = documents[i:i+batch_size]
            batch_ids = ids[i:i+batch_size]
            batch_meta = metadatas[i:i+batch_size]
            
            # Generate embeddings
            batch_embeddings = self.embedding_model.encode(batch_docs).tolist()
            
            # Add to Chroma
            self.collection.add(
                ids=batch_ids,
                documents=batch_docs,
                embeddings=batch_embeddings,
                metadatas=batch_meta
            )
            print(f"Processed {min(i + batch_size, total)}/{total} messages", end='\r')
            
        print("\nVector store built successfully.")

    def query_rag(self, query: str, k: int = 5, filters: Optional[Dict] = None):
        """Retrieve top-k relevant messages and generate a response."""
        print(f"\nQuerying: '{query}' with filters: {filters}")
        
        query_embedding = self.embedding_model.encode([query]).tolist()
        
        # Prepare filters for Chroma
        # Chroma supports a specific filter syntax
        where_clause = {}
        
        # Default: exclude system messages unless explicitly requested
        if filters and 'is_system' in filters:
             where_clause['is_system'] = filters['is_system']
        else:
             where_clause['is_system'] = False # Default exclusion
             
        if filters:
            if 'sender' in filters:
                where_clause['sender'] = filters['sender']
            # Date filtering in Chroma is tricky with ISO strings directly, 
            # usually requires timestamps (int/float). 
            # We stored ISO strings. Comparing strings works for ISO 8601 if strictly formatted.
            # But complex date range might need post-filtering if Chroma version doesn't support generic string comparison operators well.
            # Let's see if we can perform basic range if supported or post-filter.
            # Current Chroma (latest) supports $gte, $lte etc. on specific types.
        
        # Clean up empty filter
        if len(where_clause) == 0:
            where_clause = None
            
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=k,
            where=where_clause
        )
        
        retrieved_docs = results['documents'][0]
        distances = results['distances'][0]
        metadatas = results['metadatas'][0]
        
        # Generate Response (Mocked since we don't have an LLM API key configured in this script)
        # Requirement says "Generate a response". I will construct the prompt and a placeholder response.
        
        context_str = "\n".join([f"- {doc}" for doc in retrieved_docs])
        prompt = f"Context:\n{context_str}\n\nUser Query: {query}\n\nResponse:"
        
        print("-" * 30)
        print("Generated Context for LLM:")
        print(context_str)
        print("-" * 30)
        
        # In a real system, you'd call OpenAI/Mistral here.
        # return openai.ChatCompletion...
        return {
            "response": f"[Mock LLM Response based on {len(retrieved_docs)} chunks]",
            "context": retrieved_docs,
            "metadatas": metadatas,
            "distances": distances
        }

    def filter_by_sender(self, sender_name: str) -> Dict:
        """Helper to create sender filter."""
        return {"sender": sender_name}

    def filter_by_date_range(self, start_date: str, end_date: str) -> Dict:
        """Helper to create date range filter (Post-retrieval or advanced query)."""
        # Note: Chroma's where clause for string comparison ($gte, $lte) is experimental/version dependent for strings.
        # For robustness in this prototype, we might need to filter manually if Chroma fails, 
        # but let's try to pass it if possible, or just return the dict for the caller to handle/implement logic.
        print("Note: Date range filtering on string timestamps in Chroma depends on lexicographical search.")
        return {
            "timestamp": {"$gte": start_date, "$lte": end_date}
        }

    def evaluate_retrieval(self, query: str, expected_content: Optional[str] = None):
        """Test retrieval quality."""
        results = self.query_rag(query, k=5)
        
        print(f"\nEvaluation for query: '{query}'")
        for i, (doc, dist, meta) in enumerate(zip(results['context'], results['distances'], results['metadatas'])):
             print(f"{i+1}. Score: {1 - dist:.4f} | Sender: {meta['sender']} | {doc[:50]}...")
             
# --- Main Execution ---
if __name__ == "__main__":
    # Path to the uploaded file
    # Adjust this path if running in a different environment
    FILE_PATH = r"c:\Users\SAMKIEL\Downloads\Devcore_group.json"
    
    rag = RAGSystem()
    rag.load_data(FILE_PATH)
    rag.build_vector_store()
    
    # Test 1: Basic Query
    rag.evaluate_retrieval("What did we discuss about the API?")
    
    # Test 2: Filter by Sender
    print("\n--- Testing Filter by Sender ---")
    rag.query_rag("Update on the frontend?", filters=rag.filter_by_sender("Alice")) # Replace with actual name from your JSON
    
