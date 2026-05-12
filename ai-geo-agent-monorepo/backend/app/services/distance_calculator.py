from math import radians, sin, cos, sqrt, atan2

class DistanceCalculator:
    """
    Calcula distancia y tiempo de viaje usando la fórmula de Haversine
    y estimación de tiempo basada en velocidad promedio
    """
    
    # Radio de la Tierra en km
    EARTH_RADIUS_KM = 6371
    
    # Velocidad promedio en km/h (velocidad típica urbana)
    AVG_SPEED_KMH = 40
    
    @staticmethod
    def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calcula la distancia entre dos puntos usando la fórmula de Haversine
        Retorna la distancia en km
        """
        # Convertir a radianes
        lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
        
        # Diferencias
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        
        # Fórmula de Haversine
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = DistanceCalculator.EARTH_RADIUS_KM * c
        
        return round(distance, 2)
    
    @staticmethod
    def estimate_duration(distance_km: float) -> int:
        """
        Estima el tiempo de viaje en minutos basado en la distancia
        Considera tiempo de tráfico y paradas urbanas
        """
        # Tiempo base + 30% extra por tráfico y paradas
        base_time = (distance_km / DistanceCalculator.AVG_SPEED_KMH) * 60
        estimated_time = int(base_time * 1.3)
        
        # Mínimo 2 minutos
        return max(estimated_time, 2)
    
    @staticmethod
    def add_distance_and_duration(places: list, user_lat: float, user_lng: float) -> list:
        """
        Agrega distancia y duración a cada lugar
        """
        for place in places:
            if 'latitude' in place and 'longitude' in place:
                distance = DistanceCalculator.haversine_distance(
                    user_lat, user_lng,
                    place['latitude'], place['longitude']
                )
                duration = DistanceCalculator.estimate_duration(distance)
                
                place['distance'] = distance
                place['duration'] = duration
            else:
                # Si no tienen coordenadas, usar valores por defecto
                place['distance'] = 0
                place['duration'] = 0
        
        return places

distance_calculator = DistanceCalculator()
