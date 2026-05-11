export interface Place {
  name: string;
  description: string;
  url: string;
}

export interface QueryResponse {
  id: number;
  prompt: string;
  places: Place[]; 
  address: string;
  timestamp: string;
  response: string
}