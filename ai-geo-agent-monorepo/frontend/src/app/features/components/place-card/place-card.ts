import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Place } from '../../../shared/models/place.model';

@Component({
  selector: 'app-place-card',
  imports: [CommonModule],
  templateUrl: './place-card.html',
  styleUrl: './place-card.css',
})
export class PlaceCard {
  @Input() place!: Place;
  @Output() onRate = new EventEmitter<Place>();

  copied = signal(false);

  constructor() {}

  getMapUrl(): string {
    // Prioridad: dirección exacta + nombre > coordenadas > nombre del lugar
    if (this.place.address) {
      // Combina dirección con nombre para mejor precisión
      const searchQuery = `${this.place.name}, ${this.place.address}`;
      return `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
    }
    if (this.place.latitude !== undefined && this.place.longitude !== undefined) {
      // Si no hay dirección, usa coordenadas + nombre
      const searchQuery = this.place.name;
      return `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/@${this.place.latitude},${this.place.longitude},17z`;
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(this.place.name)}`;
  }

  getCategoryIcon(): string {
    const category = this.place.category?.toLowerCase() || '';
    const icons: { [key: string]: string } = {
      'restaurante': '🍽️',
      'cafe': '☕',
      'bar': '🍺',
      'museo': '🏛️',
      'parque': '🌳',
      'cine': '🎬',
      'hotel': '🏨',
      'gym': '💪',
      'supermercado': '🛒',
      'farmacia': '💊',
      'pizzeria': '🍕',
      'hamburguesa': '🍔',
      'sushi': '🍣',
      'espanol': '🥘',
      'italiano': '🍝',
      'japonés': '🍜',
      'chino': '🥡',
      'mexicano': '🌮',
      'shopping': '🛍️',
      'mercado': '🎪',
      'playa': '🏖️',
      'montaña': '⛰️',
      'iglesia': '⛪',
      'banco': '🏦',
      'biblioteca': '📚',
      'default': '📍'
    };

    // Buscar coincidencia exacta o parcial
    for (const key in icons) {
      if (category.includes(key)) return icons[key];
    }
    return icons['default'];
  }

  shareToWhatsApp() {
    const text = `${this.place.name}\n${this.place.address || 'Sin dirección'}\n⏱️ ${this.place.duration} min\n📍 ${this.place.distance} km`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  copyAddress() {
    const address = this.place.address || this.place.name;
    navigator.clipboard.writeText(address).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  emitRating() {
    this.onRate.emit(this.place);
  }
}
