import { Component, signal, inject } from '@angular/core';
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
export class Chat {
  private apiService = inject(ApiService);

  userInput = signal('');
  chatHistory = signal<any[]>([]);
  isLoading = signal(false);
  showRatingModal = signal(false);
  selectedPlaceForRating = signal<any>(null);
  ratingValue = signal(0);
  ratingComment = signal('');

  sendQuery() {
    if (!this.userInput().trim()) return;

    this.isLoading.set(true);

    // Obtenemos la ubicación real del usuario
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // Llamamos al backend
        this.apiService.askAgent(this.userInput(), latitude, longitude).subscribe({
          next: (res) => {
            // Guardamos el mensaje del usuario y la respuesta de la IA
            const currentHistory = this.chatHistory();
            const address = res.address || 'Ubicación desconocida';
            
            this.chatHistory.set([
              ...currentHistory,
              { type: 'user', text: this.userInput(), address },
              { type: 'bot', places: res.places || [], address }
            ]);

            this.userInput.set('');
            this.isLoading.set(false);
          },
          error: (err) => {
            console.error(err);
            this.isLoading.set(false);
            alert('Error al consultar el agente');
          }
        });
      },
      (err) => {
        alert('Para funcionar, activa el GPS.');
        this.isLoading.set(false);
      }
    );
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

