import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../core/api-service';

@Component({
  selector: 'app-ratings',
  imports: [CommonModule, RouterModule],
  templateUrl: './ratings.html',
  styleUrl: './ratings.css',
})
export class Ratings implements AfterViewInit {
  private apiService = inject(ApiService);

  @ViewChild('ratingsChart') chartCanvas?: ElementRef<HTMLCanvasElement>;

  ratings = signal<any[]>([]);
  isLoading = signal(false);
  averageRating = signal(0);
  chartReady = false;

  constructor() {
    this.loadRatings();
    effect(() => {
      const data = this.ratings();
      if (data.length > 0 && this.chartReady) {
        setTimeout(() => this.drawRatingsChart(), 50);
      }
    });
  }

  ngAfterViewInit() {
    this.chartReady = true;
    if (this.ratings().length > 0) {
      setTimeout(() => this.drawRatingsChart(), 50);
    }
  }

  loadRatings() {
    this.isLoading.set(true);
    this.apiService.getRatings().subscribe({
      next: (data) => {
        this.ratings.set(data);
        this.calculateAverageRating();
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  calculateAverageRating() {
    if (this.ratings().length === 0) { this.averageRating.set(0); return; }
    const sum = this.ratings().reduce((acc, r) => acc + (r.rating || 0), 0);
    this.averageRating.set(sum / this.ratings().length);
  }

  deleteRating(id: number) {
    this.apiService.deleteRating(id).subscribe({
      next: () => {
        this.ratings.update(r => r.filter(x => x.id !== id));
        this.calculateAverageRating();
      },
      error: (err) => console.error('Error eliminando:', err)
    });
  }

  getRatingStars(rating: number): string {
    return '⭐'.repeat(Math.min(5, Math.max(0, Math.round(rating))));
  }

  drawRatingsChart() {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = canvas.offsetWidth || 600;
    const H = canvas.height = 220;

    // Count per star (1-5)
    const counts = [0, 0, 0, 0, 0];
    this.ratings().forEach(r => {
      const idx = Math.round(r.rating) - 1;
      if (idx >= 0 && idx < 5) counts[idx]++;
    });

    const maxCount = Math.max(...counts, 1);
    const paddingL = 40, paddingR = 20, paddingT = 30, paddingB = 40;
    const chartW = W - paddingL - paddingR;
    const chartH = H - paddingT - paddingB;
    const barW = chartW / 7;
    const gap = barW * 0.3;

    // Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 12);
    ctx.fill();

    // Title
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DISTRIBUCIÓN DE CALIFICACIONES', paddingL, 18);

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = paddingT + (chartH / 4) * i;
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(paddingL, y);
      ctx.lineTo(W - paddingR, y);
      ctx.stroke();

      // Y-axis labels
      const label = Math.round(maxCount - (maxCount / 4) * i);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(label), paddingL - 4, y + 4);
    }

    // Bars
    const colors = [
      ['#ef4444', '#dc2626'],
      ['#f97316', '#ea580c'],
      ['#eab308', '#ca8a04'],
      ['#22c55e', '#16a34a'],
      ['#3b82f6', '#1d4ed8'],
    ];

    counts.forEach((count, i) => {
      const x = paddingL + i * (barW + gap) + gap / 2;
      const barH = count === 0 ? 3 : Math.max(3, (count / maxCount) * chartH);
      const y = paddingT + chartH - barH;

      const grad = ctx.createLinearGradient(x, y, x, paddingT + chartH);
      grad.addColorStop(0, colors[i][0]);
      grad.addColorStop(1, colors[i][1]);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Count on top of bar
      if (count > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(count), x + barW / 2, y - 6);
      }

      // Star label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}★`, x + barW / 2, H - 10);
    });
  }
}
