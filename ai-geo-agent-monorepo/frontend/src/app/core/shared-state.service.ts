import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SharedStateService {
  private searchQuerySubject = new BehaviorSubject<any>(null);
  private chatHistorySubject = new BehaviorSubject<any[]>([]);
  private ratingsSubject = new BehaviorSubject<any[]>([]);

  public searchQuery$ = this.searchQuerySubject.asObservable();
  public chatHistory$ = this.chatHistorySubject.asObservable();
  public ratings$ = this.ratingsSubject.asObservable();

  constructor() {}

  setSearchQuery(query: any) {
    this.searchQuerySubject.next(query);
  }

  getSearchQuery(): any {
    return this.searchQuerySubject.value;
  }

  setChatHistory(history: any[]) {
    this.chatHistorySubject.next(history);
  }

  getChatHistory(): any[] {
    return this.chatHistorySubject.value;
  }

  addChatMessage(message: any) {
    const current = this.chatHistorySubject.value;
    this.chatHistorySubject.next([...current, message]);
  }

  setRatings(ratings: any[]) {
    this.ratingsSubject.next(ratings);
  }

  getRatings(): any[] {
    return this.ratingsSubject.value;
  }

  addRating(rating: any) {
    const current = this.ratingsSubject.value;
    this.ratingsSubject.next([...current, rating]);
  }
}
