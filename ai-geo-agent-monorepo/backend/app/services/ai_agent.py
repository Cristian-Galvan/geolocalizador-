import requests
import os
import json
import time
from dotenv import load_dotenv

load_dotenv()

class AIAgent:
    def __init__(self):
        self.api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
        self.model_name = "gemini-3-flash-preview"
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        self.timeout = 45  # Aumentado de 15 a 45 segundos
        self.max_retries = 3
        self.retry_delay = 2  # segundos

    async def get_recommendation(self, prompt: str, lat: float, lng: float):
        payload = {
            "contents": [{
                "role": "user",
                "parts": [{
                    "text": f"""Ubicación: {lat},{lng}. Pregunta: {prompt}

Devuelve MÍNIMO 6 lugares reales cercanos EN ESTE JSON:
{{"places":[{{"name":"Nombre","description":"Breve","category":"Tipo","address":"Calle Nombre Número, Ciudad","latitude":0.0,"longitude":0.0,"phone":"###","url":"https://maps.google.com/?q=0.0,0.0"}}]}}

IMPORTANTE:
- SOLO JSON, SIN TEXTO EXTRA
- Dirección EXACTA: "Calle Nombre Número Exterior, Ciudad"
- Incluir número de exterior en la dirección
- Coordenadas reales y verificadas
- Mínimo 6 lugares
- Ordena por distancia"""
                }]
            }]
        }
        
        headers = {'Content-Type': 'application/json'}
        
        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    self.url, 
                    json=payload, 
                    headers=headers, 
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    return self._parse_response(response)
                elif response.status_code == 429:
                    # Rate limit - esperar más tiempo
                    if attempt < self.max_retries - 1:
                        time.sleep(self.retry_delay * (attempt + 2))
                        continue
                    return {"places": [], "error": "API en límite de solicitudes. Intenta en unos segundos."}
                elif response.status_code == 500:
                    # Server error - reintentar
                    if attempt < self.max_retries - 1:
                        time.sleep(self.retry_delay * (attempt + 1))
                        continue
                    return {"places": [], "error": "Servidor de IA no disponible. Intenta de nuevo."}
                else:
                    return {"places": [], "error": f"Error API ({response.status_code})"}
                    
            except requests.exceptions.Timeout:
                if attempt < self.max_retries - 1:
                    print(f"Timeout en intento {attempt + 1}, reintentando...")
                    time.sleep(self.retry_delay * (attempt + 1))
                    continue
                return {"places": [], "error": "Timeout: la IA tarda demasiado. Intenta con una pregunta más simple."}
                
            except requests.exceptions.ConnectionError as e:
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
                    continue
                return {"places": [], "error": "Error de conexión. Verifica tu internet."}
                
            except Exception as e:
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay)
                    continue
                return {"places": [], "error": f"Error inesperado: {str(e)[:50]}"}

        return {"places": [], "error": "No se pudo conectar después de varios intentos."}

    def _parse_response(self, response):
        """Parsea la respuesta de la API"""
        try:
            data = response.json()
            if 'candidates' in data and data['candidates']:
                text_response = data['candidates'][0]['content']['parts'][0]['text']
                
                # Limpiar y parsear JSON
                cleaned = text_response.strip()
                json_data = json.loads(cleaned)
                return json_data
            else:
                return {"places": [], "error": "Respuesta vacía del servidor"}
                
        except json.JSONDecodeError:
            return {"places": [], "error": "Respuesta no fue JSON válido"}
        except (KeyError, IndexError):
            return {"places": [], "error": "Formato de respuesta inesperado"}

ai_agent = AIAgent()