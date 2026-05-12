import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email: string;
    full_name?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000/api/auth';
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  currentUser = signal<LoginResponse['user'] | null>(null);
  isLoggedIn = signal(false);

  constructor(private http: HttpClient, private router: Router) {
    this.loadAuthState();
    this.validateSession();
  }

  private validateSession() {
    // Validar que el token sea válido haciendo una petición al backend
    if (this.getToken()) {
      this.http.get<any>(`${this.apiUrl}/me`, {
        headers: this.getAuthHeaders()
      }).subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.isLoggedIn.set(true);
        },
        error: () => {
          // Token inválido o expirado, limpiar
          this.logout();
        }
      });
    }
  }

  private loadAuthState() {
    const token = localStorage.getItem(this.tokenKey);
    const user = localStorage.getItem(this.userKey);

    if (token && user) {
      this.isLoggedIn.set(true);
      this.currentUser.set(JSON.parse(user));
    }
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      username,
      password
    }).pipe(
      tap((response) => {
        this.setAuthState(response);
      })
    );
  }

  register(username: string, email: string, password: string, full_name?: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, {
      username,
      email,
      password,
      full_name
    }).pipe(
      tap((response) => {
        this.setAuthState(response);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  clearSession() {
    // Limpia la sesión sin navegar (usado por el interceptor)
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private setAuthState(response: LoginResponse) {
    localStorage.setItem(this.tokenKey, response.access_token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.isLoggedIn.set(true);
    this.currentUser.set(response.user);
  }
}
