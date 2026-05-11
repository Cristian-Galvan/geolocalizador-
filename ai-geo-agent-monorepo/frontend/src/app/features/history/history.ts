import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PlaceCard } from '../components/place-card/place-card';
import { ApiService } from '../../core/api-service';
import { QueryResponse } from '../../shared/models/place.model';

@Component({
  selector: 'app-history',
  imports: [CommonModule, RouterModule,],
  templateUrl: './history.html',
  styleUrl: './history.css',
})
export class History {
  private apiService = inject(ApiService);

  searchHistory = signal<QueryResponse[]>([]);
  isLoading = signal(false);
  selectedQuery = signal<QueryResponse | null>(null);

  constructor() {
    this.loadHistory();
  }

  loadHistory() {
    this.isLoading.set(true);
    this.apiService.getHistory().subscribe({
      next: (data) => {
        this.searchHistory.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error cargando historial:', err);
        this.isLoading.set(false);
      }
    });
  }

  selectQuery(query: QueryResponse) {
    this.selectedQuery.set(query);
  }

  deleteQuery(id: number) {
    this.apiService.deleteQuery(id).subscribe({
      next: () => {
        const updated = this.searchHistory().filter(q => q.id !== id);
        this.searchHistory.set(updated);
        
        if (this.selectedQuery()?.id === id) {
          this.selectedQuery.set(null);
        }
      },
      error: (err) => console.error('Error eliminando búsqueda:', err)
    });
  }
}
