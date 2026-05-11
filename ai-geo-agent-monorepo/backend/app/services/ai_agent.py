import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

class AIAgent:
    def __init__(self):
        self.api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
        # NOMBRE DEL MODELO SEGÚN TU CAPTURA DE PANTALLA:
        self.model_name = "gemini-3-flash-preview" 
        # En 2026, los modelos preview suelen usar v1beta
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"

    async def get_recommendation(self, prompt: str, lat: float, lng: float):
        payload = {
            "contents": [{
                "role": "user",
                "parts": [{
                    "text": f"""Usuario en {lat}, {lng}. Pregunta: {prompt}. 
                    
Por favor, sugiere 3 lugares reales cercanos y devuelve EXACTAMENTE en este formato JSON:
{{
  "places": [
    {{
      "name": "Nombre del lugar",
      "description": "Descripción breve",
      "category": "Categoría (restaurante/museo/parque/etc)",
      "url": "https://maps.google.com/?q={lat},{lng}"
    }},
    // ... más lugares
  ]
}}

Solo devuelve el JSON, sin texto adicional."""
                }]
            }]
        }
        
        headers = {'Content-Type': 'application/json'}
        
        try:
            response = requests.post(self.url, json=payload, headers=headers, timeout=15)
            
            if response.status_code != 200:
                return {"places": [], "error": f"Error ({response.status_code}): {response.text}"}
                
            data = response.json()
            # Estructura de respuesta estándar para Gemini 3
            if 'candidates' in data and data['candidates']:
                text_response = data['candidates'][0]['content']['parts'][0]['text']
                
                # Intentar parsear como JSON
                try:
                    # Limpiar espacios en blanco y comillas
                    cleaned = text_response.strip()
                    json_data = json.loads(cleaned)
                    return json_data
                except json.JSONDecodeError:
                    # Si falla el JSON, devolver error
                    return {"places": [], "error": "Respuesta no fue JSON válido"}
            
            return {"places": [], "error": "No se pudo generar una respuesta."}

        except Exception as e:
            return {"places": [], "error": f"Error de conexión: {str(e)}"}

ai_agent = AIAgent()