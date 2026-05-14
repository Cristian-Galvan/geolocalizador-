import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlaceCard } from '../components/place-card/place-card';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api-service';

const MIN_QUERY_LENGTH = 3;
const MAX_QUERY_LENGTH = 500;
const MAX_COMMENT_LENGTH = 300;

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
  sendError = signal('');
  gpsError = signal('');

  showRatingModal = signal(false);
  selectedPlaceForRating = signal<any>(null);
  ratingValue = signal(0);
  ratingComment = signal('');
  ratingError = signal('');

  userLocation = signal<{ lat: number; lng: number } | null>(null);

  readonly maxQueryLength = MAX_QUERY_LENGTH;
  readonly maxCommentLength = MAX_COMMENT_LENGTH;

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
    this.getLocation();
    this.loadChatHistory();
  }

  getLocation() {
    if (!navigator.geolocation) {
      this.gpsError.set('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userLocation.set({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        this.gpsError.set('');
      },
      () => {
        this.gpsError.set('GPS no disponible. Activa la ubicación para usar el chat.');
      }
    );
  }

  loadChatHistory() {
    const saved = localStorage.getItem('chatHistory');
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        this.chatHistory.set(parsed.slice(-50));
      }
    } catch {
      localStorage.removeItem('chatHistory');
    }
  }

  saveChatHistory() {
    const trimmed = this.chatHistory().slice(-50);
    localStorage.setItem('chatHistory', JSON.stringify(trimmed));
  }

  playSuccessSound(): void {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99]; // C5 E5 G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.13;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.07, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.start(t);
        osc.stop(t + 0.28);
      });
    } catch { /* Ignorar si el navegador no soporta AudioContext */ }
  }

  sendQuery(query?: string) {
    if (this.isLoading()) return;

    const input = (query || this.userInput()).trim();
    this.sendError.set('');

    if (!input) {
      this.sendError.set('Escribe una pregunta antes de enviar.');
      return;
    }

    if (input.length < MIN_QUERY_LENGTH) {
      this.sendError.set(`La pregunta debe tener al menos ${MIN_QUERY_LENGTH} caracteres.`);
      return;
    }

    if (input.length > MAX_QUERY_LENGTH) {
      this.sendError.set(`La pregunta no puede superar ${MAX_QUERY_LENGTH} caracteres.`);
      return;
    }

    if (!query) this.userInput.set('');
    this.isLoading.set(true);
    this.filteredSuggestions.set([]);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.userLocation.set({ lat: latitude, lng: longitude });
        this.gpsError.set('');

        this.apiService.askAgent(input, latitude, longitude).subscribe({
          next: (res) => {
            const address = res.address || 'Ubicación desconocida';
            this.chatHistory.update(history => [
              ...history,
              { type: 'user', text: input, address, timestamp: new Date().toLocaleTimeString() },
              { type: 'bot', places: res.places || [], address, timestamp: new Date().toLocaleTimeString(), error: res.error }
            ]);
            this.saveChatHistory();
            this.isLoading.set(false);
            if ((res.places || []).length > 0) this.playSuccessSound();
          },
          error: (err) => {
            this.isLoading.set(false);
            const detail = err?.error?.detail || '';
            if (detail.includes('límite') || detail.includes('429')) {
              this.sendError.set('⚠️ Límite de solicitudes alcanzado. Espera 30 segundos e intenta de nuevo.');
            } else if (detail.includes('timeout')) {
              this.sendError.set('⏱️ La IA tardó demasiado. Intenta con una pregunta más simple.');
            } else {
              this.sendError.set('Error al consultar el agente. Intenta de nuevo.');
            }
          }
        });
      },
      () => {
        this.isLoading.set(false);
        this.gpsError.set('Activa el GPS para usar esta función.');
      },
      { timeout: 10000 }
    );
  }

  onInputChange(value: string) {
    if (value.length <= MAX_QUERY_LENGTH) {
      this.userInput.set(value);
    } else {
      this.userInput.set(value.slice(0, MAX_QUERY_LENGTH));
    }
    this.sendError.set('');

    const trimmed = value.trim();
    if (trimmed.length > 0) {
      this.filteredSuggestions.set(
        this.suggestions.filter(s => s.toLowerCase().includes(trimmed.toLowerCase()))
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
    this.ratingError.set('');
  }

  closeRatingModal() {
    this.showRatingModal.set(false);
    this.selectedPlaceForRating.set(null);
    this.ratingError.set('');
  }

  onCommentChange(value: string) {
    if (value.length <= MAX_COMMENT_LENGTH) {
      this.ratingComment.set(value);
    } else {
      this.ratingComment.set(value.slice(0, MAX_COMMENT_LENGTH));
    }
  }

  submitRating() {
    this.ratingError.set('');

    if (this.ratingValue() === 0) {
      this.ratingError.set('Por favor selecciona una calificación.');
      return;
    }

    const comment = this.ratingComment().trim();
    if (comment.length > MAX_COMMENT_LENGTH) {
      this.ratingError.set(`El comentario no puede superar ${MAX_COMMENT_LENGTH} caracteres.`);
      return;
    }

    const place = this.selectedPlaceForRating();
    this.apiService.ratePlace({
      name: place.name,
      address: place.address || 'Sin ubicación',
      rating: this.ratingValue(),
      comment: comment || undefined
    }).subscribe({
      next: () => {
        this.closeRatingModal();
      },
      error: () => {
        this.ratingError.set('Error al guardar la calificación. Intenta de nuevo.');
      }
    });
  }

  setRating(value: number) {
    this.ratingValue.set(value);
    this.ratingError.set('');
  }
}
