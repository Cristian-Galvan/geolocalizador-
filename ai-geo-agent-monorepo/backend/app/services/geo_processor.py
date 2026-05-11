from geopy.geocoders import Nominatim
from geopy.exc import GeopyError
import ssl
import certifi

class GeoProcessor:
    def __init__(self):
        # Creamos un contexto SSL usando certifi para evitar errores de certificados en Windows
        ctx = ssl.create_default_context(cafile=certifi.where())
        
        # CAMBIO CLAVE: Usamos un user_agent mucho más largo y único.
        # Esto evita que los servidores de OpenStreetMap nos bloqueen.
        self.geolocator = Nominatim(
            user_agent="ai_geo_agent_project_v1_kris_unique_identifier",
            ssl_context=ctx,
            timeout=10
        )

    def get_address(self, lat: float, lng: float) -> str:
        try:
            # Intentamos la geocodificación inversa
            location = self.geolocator.reverse((lat, lng), language="es")
            if location:
                return location.address
            return f"Ubicación exacta no disponible (Lat: {lat}, Lng: {lng})"
            
        except Exception as e:
            # Imprimimos el error real en la terminal para saber qué pasa
            print(f"--- Error en Geopy: {str(e)} ---")
            return f"Coordenadas: {lat}, {lng}"

# No olvides la instancia al final para que main.py pueda importarla
geo_processor = GeoProcessor()