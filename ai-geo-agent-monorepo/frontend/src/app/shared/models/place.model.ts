export interface Place {
  name: string;
  description?: string;
  url?: string;
  category?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  duration?: number;
}

export interface QueryResponse {
  id: number;
  prompt: string;
  places: Place[]; 
  address: string;
  timestamp: string;
  response: string
}