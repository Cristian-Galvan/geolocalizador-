import { Component, Input, Output, EventEmitter } from '@angular/core';
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

  constructor() {}

  emitRating() {
    this.onRate.emit(this.place);
  }
}
