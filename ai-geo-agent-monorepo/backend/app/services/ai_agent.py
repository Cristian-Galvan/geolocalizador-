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
        self.timeout = 45
        self.max_retries = 1

    async def get_recommendation(self, prompt: str, lat: float, lng: float, address: str = ""):
        if not self.api_key:
            return {"places": [], "error": "GEMINI_API_KEY no configurada en el servidor."}

        prompt_text = f"""Eres un asistente de geolocalización. El usuario está físicamente ubicado en:
- Dirección: {address}
- Coordenadas GPS: latitud {lat}, longitud {lng}

El usuario pregunta: "{prompt}"

Devuelve EXACTAMENTE 6 lugares reales que existan cerca de esa ubicación.
La respuesta debe ser ÚNICAMENTE un objeto JSON válido con este formato:

{{
  "places": [
    {{
      "name": "Nombre real del establecimiento",
      "description": "Descripción breve y precisa (1-2 oraciones)",
      "category": "Tipo de lugar (ej: Restaurante, Museo, Parque, Cafetería)",
      "address": "Dirección completa: Calle Número, Colonia/Barrio, Ciudad",
      "latitude": {lat},
      "longitude": {lng},
      "phone": "Número de teléfono si lo conoces, o cadena vacía",
      "url": "https://maps.google.com/?q=LATITUD,LONGITUD"
    }}
  ]
}}

REGLAS CRÍTICAS:
1. Solo JSON, sin texto extra, sin bloques de código markdown.
2. Las coordenadas de cada lugar deben ser REALES y estar a menos de 15 km de ({lat}, {lng}).
3. Si no conoces las coordenadas exactas de un lugar, usa coordenadas aproximadas de esa zona de la ciudad — NUNCA uses 0.0, 0.0.
4. Las URLs de Google Maps deben usar las coordenadas del lugar: https://maps.google.com/?q=LAT,LNG
5. Prioriza lugares conocidos, cadenas establecidas o puntos de referencia reconocibles.
6. Las direcciones deben incluir nombre de calle y número cuando sea posible."""

        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt_text}]}],
            "generationConfig": {
                "temperature": 0.2,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 2048
            }
        }

        headers = {"Content-Type": "application/json"}

        for attempt in range(self.max_retries):
            try:
                response = requests.post(self.url, json=payload, headers=headers, timeout=self.timeout)

                if response.status_code == 200:
                    return self._parse_response(response)
                elif response.status_code == 429:
                    if attempt < self.max_retries - 1:
                        time.sleep(4)
                        continue
                    return {"places": [], "error": "API en límite de solicitudes. Espera un momento e intenta de nuevo."}
                elif response.status_code == 500:
                    if attempt < self.max_retries - 1:
                        time.sleep(2)
                        continue
                    return {"places": [], "error": "Servidor de IA no disponible. Intenta de nuevo."}
                else:
                    return {"places": [], "error": f"Error API ({response.status_code})"}

            except requests.exceptions.Timeout:
                return {"places": [], "error": "Timeout: la IA tardó demasiado. Intenta con una pregunta más simple."}
            except requests.exceptions.ConnectionError:
                return {"places": [], "error": "Error de conexión con el servidor de IA."}
            except Exception as e:
                return {"places": [], "error": f"Error inesperado: {str(e)[:80]}"}

        return {"places": [], "error": "No se pudo obtener respuesta de la IA."}

    def _parse_response(self, response):
        try:
            data = response.json()
            if "candidates" not in data or not data["candidates"]:
                return {"places": [], "error": "Respuesta vacía del servidor de IA"}

            text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

            # Limpiar bloque markdown si Gemini lo devuelve igualmente
            if "```" in text:
                start = text.find("{")
                end = text.rfind("}") + 1
                if start != -1 and end > start:
                    text = text[start:end]

            return json.loads(text)

        except json.JSONDecodeError as e:
            return {"places": [], "error": f"JSON inválido en respuesta de IA: {str(e)[:60]}"}
        except (KeyError, IndexError):
            return {"places": [], "error": "Formato de respuesta inesperado"}


ai_agent = AIAgent()
