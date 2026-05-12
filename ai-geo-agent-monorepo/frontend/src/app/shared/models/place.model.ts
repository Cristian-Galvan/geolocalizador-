export interface Place {
  name: string;
  description: string;
  url: string;
  category?: string;
  address?: string;        // Dirección exacta
  phone?: string;          // Teléfono
  latitude?: number;
  longitude?: number;
  distance?: number;       // Distancia en km
  duration?: number;       // Tiempo en minutos
}

export interface QueryResponse {
  id: number;
  prompt: string;
  places: Place[]; 
  address: string;
  timestamp: string;
  response: string
}