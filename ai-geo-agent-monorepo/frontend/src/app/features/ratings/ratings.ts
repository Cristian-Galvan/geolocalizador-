import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/api-service';

@Component({
  selector: 'app-ratings',
  imports: [CommonModule, RouterModule],
  templateUrl: './ratings.html',
  styleUrl: './ratings.css',
})
export class Ratings {
  private apiService = inject(ApiService);

  ratings = signal<any[]>([]);
  isLoading = signal(false);
  averageRating = signal(0);

  constructor() {
    this.loadRatings();
  }

  loadRatings() {
    this.isLoading.set(true);
    this.apiService.getRatings().subscribe({
      next: (data) => {
        this.ratings.set(data);
        this.calculateAverageRating();
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando calificaciones:', err);
        this.isLoading.set(false);
      }
    });
  }

  calculateAverageRating() {
    if (this.ratings().length === 0) {
      this.averageRating.set(0);
      return;
    }
    const sum = this.ratings().reduce((acc, r) => acc + (r.rating || 0), 0);
    this.averageRating.set(sum / this.ratings().length);
  }

  deleteRating(id: number) {
    this.apiService.deleteRating(id).subscribe({
      next: () => {
        const updated = this.ratings().filter(r => r.id !== id);
        this.ratings.set(updated);
        this.calculateAverageRating();
      },
      error: (err) => console.error('Error eliminando calificación:', err)
    });
  }

  getRatingStars(rating: number): string {
    return '⭐'.repeat(Math.round(rating));
  }
}
