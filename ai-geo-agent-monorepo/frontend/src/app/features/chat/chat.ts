import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlaceCard } from '../components/place-card/place-card';
import { Place } from '../../shared/models/place.model';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api-service';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, PlaceCard, FormsModule, RouterModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat implements OnInit {
  private apiService = inject(ApiService);

  userInput = signal('');
  chatHistory = signal<any[]>([]);
  isLoading = signal(false);
  showRatingModal = signal(false);
  selectedPlaceForRating = signal<any>(null);
  ratingValue = signal(0);
  ratingComment = signal('');
  userLocation = signal<{ lat: number; lng: number } | null>(null);
  
  // Quick suggestions
  suggestions = [
    '🍽️ Restaurantes cercanos',
    '☕ Cafeterías',
    '🏛️ Museos y cultura',
    '🌳 Parques y naturaleza',
    '🎬 Entretenimiento',
    '🏨 Alojamiento'
  ];
  filteredSuggestions = signal<string[]>([]);

  ngOnInit() {
    // Obtener ubicación al cargar la página
    this.getLocation();
    // Cargar historial del localStorage
    this.loadChatHistory();
  }

  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLocation.set({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        () => {
          console.warn('Ubicación no disponible');
        }
      );
    }
  }

  loadChatHistory() {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
      try {
        this.chatHistory.set(JSON.parse(saved));
      } catch (e) {
        console.error('Error cargando historial', e);
      }
    }
  }

  saveChatHistory() {
    localStorage.setItem('chatHistory', JSON.stringify(this.chatHistory()));
  }

  sendQuery(query?: string) {
    const input = query || this.userInput().trim();
    if (!input) return;

    if (!query) this.userInput.set('');
    this.isLoading.set(true);

    // Obtener ubicación del usuario
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.userLocation.set({ lat: latitude, lng: longitude });

        // Llamar al backend
        this.apiService.askAgent(input, latitude, longitude).subscribe({
          next: (res) => {
            const currentHistory = this.chatHistory();
            const address = res.address || 'Ubicación desconocida';
            
            const newHistory = [
              ...currentHistory,
              { type: 'user', text: input, address, timestamp: new Date().toLocaleTimeString() },
              { type: 'bot', places: res.places || [], address, timestamp: new Date().toLocaleTimeString(), error: res.error }
            ];
            
            this.chatHistory.set(newHistory);
            this.saveChatHistory();
            this.isLoading.set(false);
            this.filteredSuggestions.set([]);
          },
          error: (err) => {
            console.error(err);
            this.isLoading.set(false);
            
            // Mostrar error amigable
            const errorMsg = err?.error?.detail || err?.message || 'Error desconocido';
            let userFriendlyMsg = 'Error al consultar el agente';
            
            if (errorMsg.includes('timeout')) {
              userFriendlyMsg = '⏱️ Timeout: La IA tardó demasiado. Intenta con una pregunta más simple (ej: "Restaurantes") en lugar de "Restaurantes italianos con wifi")';
            } else if (errorMsg.includes('429')) {
              userFriendlyMsg = '⚠️ Muchas solicitudes. Espera 30 segundos e intenta de nuevo.';
            } else if (errorMsg.includes('conexión')) {
              userFriendlyMsg = '🌐 Error de conexión. Verifica tu internet.';
            }
            
            alert(userFriendlyMsg);
          }
        });
      },
      (err) => {
        alert('Por favor, activa el GPS para usar esta función');
        this.isLoading.set(false);
      }
    );
  }

  onInputChange(value: string) {
    this.userInput.set(value);
    // Filtrar sugerencias basadas en lo que escribe el usuario
    if (value.trim().length > 0) {
      this.filteredSuggestions.set(
        this.suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()))
      );
    } else {
      this.filteredSuggestions.set([]);
    }
  }

  clearHistory() {
    if (confirm('¿Borrar todo el historial de búsquedas?')) {
      this.chatHistory.set([]);
      localStorage.removeItem('chatHistory');
    }
  }

  downloadHistoryAsJSON() {
    const data = JSON.stringify(this.chatHistory(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial-lugares-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  openRatingModal(place: any) {
    this.selectedPlaceForRating.set(place);
    this.showRatingModal.set(true);
    this.ratingValue.set(0);
    this.ratingComment.set('');
  }

  closeRatingModal() {
    this.showRatingModal.set(false);
    this.selectedPlaceForRating.set(null);
  }

  submitRating() {
    if (this.ratingValue() === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }

    const place = this.selectedPlaceForRating();
    const ratingData = {
      name: place.name,
      address: place.address || 'Sin ubicación',
      rating: this.ratingValue(),
      comment: this.ratingComment()
    };

    this.apiService.ratePlace(ratingData).subscribe({
      next: () => {
        alert('¡Gracias por tu calificación!');
        this.closeRatingModal();
      },
      error: (err) => {
        console.error(err);
        alert('Error al guardar la calificación');
      }
    });
  }

  setRating(value: number) {
    this.ratingValue.set(value);
  }
}

