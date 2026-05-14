import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  isLogin = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');

  loginUsername = signal('');
  loginPassword = signal('');

  registerUsername = signal('');
  registerEmail = signal('');
  registerPassword = signal('');
  registerConfirmPassword = signal('');
  registerFullName = signal('');

  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/chat']);
    }
  }

  toggleForm() {
    this.isLogin.update(val => !val);
    this.errorMessage.set('');
  }

  login() {
    const username = this.loginUsername().trim();
    const password = this.loginPassword();

    if (!username || !password) {
      this.errorMessage.set('Por favor completa todos los campos');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(username, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.detail || 'Usuario o contraseña incorrectos');
      }
    });
  }

  register() {
    const username = this.registerUsername().trim();
    const email = this.registerEmail().trim();
    const password = this.registerPassword();
    const confirm = this.registerConfirmPassword();
    const fullName = this.registerFullName().trim();

    if (!username || !email || !password || !confirm) {
      this.errorMessage.set('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!this.usernameRegex.test(username)) {
      this.errorMessage.set('El usuario debe tener 3-20 caracteres (letras, números o _), sin espacios');
      return;
    }

    if (!this.emailRegex.test(email)) {
      this.errorMessage.set('El email no tiene un formato válido');
      return;
    }

    if (password.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password.length > 100) {
      this.errorMessage.set('La contraseña no puede exceder 100 caracteres');
      return;
    }

    if (password !== confirm) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    if (fullName.length > 60) {
      this.errorMessage.set('El nombre no puede exceder 60 caracteres');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(username, email, password, fullName || undefined).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.detail || 'Error en el registro. Intenta con otro usuario o email.');
      }
    });
  }
}
