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

  // Login form
  loginUsername = signal('');
  loginPassword = signal('');

  // Register form
  registerUsername = signal('');
  registerEmail = signal('');
  registerPassword = signal('');
  registerConfirmPassword = signal('');
  registerFullName = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Si el usuario ya está autenticado, redirigir a chat
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/chat']);
    }
  }

  toggleForm() {
    this.isLogin.update(val => !val);
    this.errorMessage.set('');
  }

  login() {
    if (!this.loginUsername() || !this.loginPassword()) {
      this.errorMessage.set('Por favor completa todos los campos');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginUsername(), this.loginPassword()).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.detail || 'Error en el login');
      }
    });
  }

  register() {
    if (!this.registerUsername() || !this.registerEmail() || !this.registerPassword() || !this.registerConfirmPassword()) {
      this.errorMessage.set('Por favor completa todos los campos');
      return;
    }

    if (this.registerPassword() !== this.registerConfirmPassword()) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    if (this.registerPassword().length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(
      this.registerUsername(),
      this.registerEmail(),
      this.registerPassword(),
      this.registerFullName()
    ).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.detail || 'Error en el registro');
      }
    });
  }
}
