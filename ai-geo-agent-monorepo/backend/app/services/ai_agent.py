import requests
import os
import json
import time
from dotenv import load_dotenv

load_dotenv()

class AIAgent:
    def __init__(self):
        self.api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
        # El modelo "gemini-3-flash-preview" no existe. Se corrige al modelo flash más reciente.
        self.model_name = "gemini-1.5-flash-latest"
        self.url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        self.timeout = 45  # Aumentado de 15 a 45 segundos
        self.max_retries = 3
        self.retry_delay = 2  # segundos

    async def get_recommendation(self, prompt: str, lat: float, lng: float):
        # Se añade una verificación para la clave de API. Si no está configurada,
        # se devuelve un error claro en lugar de un fallo genérico de la API.
        if not self.api_key:
            return {"places": [], "error": "Error de configuración: La clave de API de Gemini no está configurada en el servidor."}

        json_format_example = """
{
    "places": [
        {
            "name": "Nombre del Lugar",
            "description": "Descripción breve y útil sobre el lugar.",
            "category": "Categoría (ej. Restaurante, Museo, Parque)",
            "address": "Calle Falsa 123, Colonia, Ciudad",
            "latitude": 19.4326,
            "longitude": -99.1332,
            "phone": "+52 55 1234 5678",
            "url": "https://maps.google.com/?q=19.4326,-99.1332"
        }
    ]
}
"""
        payload = {
            "contents": [{
                "role": "user",
                "parts": [{
                    "text": f"""Basado en mi ubicación actual ({lat}, {lng}), responde a mi pregunta: "{prompt}".

Devuelve una lista de MÍNIMO 6 lugares reales y cercanos que coincidan con mi petición.
La respuesta DEBE ser únicamente un objeto JSON válido, sin texto adicional antes o después.

Usa este formato JSON exacto:
{json_format_example}

Reglas importantes:
- La respuesta debe ser solo el JSON. No incluyas "```json" o "```".
- Proporciona direcciones exactas y completas, incluyendo calle y número si es posible.
- Las coordenadas (latitud y longitud) deben ser precisas para cada lugar.
- La URL de Google Maps debe usar las coordenadas del lugar: `https://maps.google.com/?q=LATITUD,LONGITUD`.
- Ordena los resultados por relevancia y proximidad a mi ubicación.
"""
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