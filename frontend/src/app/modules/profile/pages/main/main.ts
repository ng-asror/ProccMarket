import { ChangeDetectionStrategy, Component, inject, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { Auth, Layout, NumeralPipe, ProfileService, Telegram } from '../../../../core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-main',
  imports: [NumeralPipe, LucideAngularModule, NgIf, RouterLink, FormsModule],
  templateUrl: './main.html',
  styleUrl: './main.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Main {
  private authService = inject(Auth);
  private profileService = inject(ProfileService);
  private layoutService = inject(Layout);
  private telegram = inject(Telegram);

  protected ICONS = icons;
  protected message: string = '';
  protected rating: number = 4;
  protected logout(): void {
    this.authService.logout();
  }
  profile = resource({
    loader: () => firstValueFrom(this.profileService.getProfile()),
  });

  async sendReview(): Promise<void> {
    const dialog: HTMLDialogElement | null = document.getElementById(
      'my_modal_5'
    ) as HTMLDialogElement;
    dialog?.close();
    await firstValueFrom(this.layoutService.writeReview(this.rating, this.message))
      .then((res) => {
        this.telegram.showAlert('Отзыв успешно отправлен!');
        this.message = '';
        this.rating = 4;
      })
      .catch((error) => {
        if (error.status === 429) {
          const nextWithdrawal = error.error.next_review_at;
          const dateObj = new Date(nextWithdrawal);
          const formatted = dateObj.toLocaleString('ru-RU', {
            month: 'long',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
          this.telegram.showAlert(
            `Вы можете отправлять только один отзыв каждые 24 часа. Следующий отзыв можно будет оставить: ${formatted}`
          );
        }
      });
  }
}
