import { Routes } from '@angular/router';
import { Chat } from './features/chat/chat';
import { History } from './features/history/history';
import { Ratings } from './features/ratings/ratings';
import { Login } from './features/login/login';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', redirectTo: '/chat', pathMatch: 'full' },
  { path: 'chat', component: Chat, canActivate: [authGuard] },
  { path: 'history', component: History, canActivate: [authGuard] },
  { path: 'ratings', component: Ratings, canActivate: [authGuard] },
  { path: '**', redirectTo: '/chat' }
];
