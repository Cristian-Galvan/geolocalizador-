import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  // Se cambia la URL fija por una variable de entorno para facilitar el cambio
  // entre desarrollo local y producción.
  
  private baseUrl = 'https://geolocalizador-production-1c75.up.railway.app';
  private authService = inject(AuthService);
  private http = inject(HttpClient);

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  } 

  // Pide recomendaciones al agente
  askAgent(prompt: string, lat: number, lng: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/ask`, 
      { prompt, latitude: lat, longitude: lng },
      { headers: this.getHeaders() }
    );
  }

  // Guarda una calificación
  ratePlace(placeData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/ratings`, 
      placeData,
      { headers: this.getHeaders() }
    );
  }

  // Obtiene el historial de búsquedas
  getHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/history`, 
      { headers: this.getHeaders() }
    );
  }

  // Elimina una búsqueda del historial
  deleteQuery(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/history/${id}`, 
      { headers: this.getHeaders() }
    );
  }

  // Obtiene todas las calificaciones
  getRatings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/ratings`, 
      { headers: this.getHeaders() }
    );
  }

  // Elimina una calificación
  deleteRating(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/ratings/${id}`, 
      { headers: this.getHeaders() }
    );
  }
}