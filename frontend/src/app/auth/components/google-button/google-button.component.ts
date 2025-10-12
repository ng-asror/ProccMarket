import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  NgZone,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GoogleIdentityService } from '../../../core/services/google-identity.service';
import { Auth } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { Telegram } from '../../../core';

@Component({
  selector: 'google-btn',
  imports: [CommonModule],
  template: `<div #container class="w-full flex justify-center"></div>`,
})
export class GoogleButtonComponent implements AfterViewInit, OnDestroy {
  private telegram = inject(Telegram);
  private gis = inject(GoogleIdentityService);
  private auth = inject(Auth);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;

  @Input() theme = 'outline';
  @Input() size = 'large';
  @Input() width: string | number = '100%';

  @Output() credential = new EventEmitter<any>();

  private sub?: Subscription;
  private isProcessing = false;

  async ngAfterViewInit(): Promise<void> {
    try {
      await this.gis.ready();
      await this.gis.renderButton(this.container.nativeElement, {
        theme: this.theme,
        size: this.size,
        width: this.width,
      });

      // Credential hodisalarini kuzatamiz
      this.sub = this.gis.credential$.subscribe((res) => {
        this.credential.emit(res);
        this.handleCredentialResponse(res);
      });
    } catch (err) {
      console.error('[GoogleButtonComponent] Google init or Render error:', err);
    }
  }

  /**
   * Google'dan qaytgan credential tokenni backendga yuborish
   */
  private async handleCredentialResponse(response: any): Promise<void> {
    // Bir vaqtning o'zida bir nechta so'rov yuborilishini oldini olish
    if (this.isProcessing) {
      console.log('[GoogleButtonComponent] Already processing, ignoring duplicate request');
      return;
    }

    const idToken = response?.credential;
    const tgUser = await this.telegram.getTgUser();
    const telegram_id = tgUser?.user.id;

    if (!idToken) {
      console.warn('[GoogleButtonComponent] Empty Google ID token.');
      return;
    }
    this.isProcessing = true;

    console.info('[GoogleButtonComponent] Google ID token received, logging in...');

    this.auth.googleLogin(idToken, String(telegram_id)).subscribe({
      next: (res) => {
        console.log('[GoogleButtonComponent] Google login success:', res);

        // NgZone ichida navigate qilish (Angular change detection uchun)
        this.ngZone.run(() => {
          this.router
            .navigate(['/home'])
            .then(() => {
              console.log('[GoogleButtonComponent] Navigation complete');
              this.isProcessing = false;
            })
            .catch((err) => {
              console.error('[GoogleButtonComponent] Navigation error:', err);
              this.isProcessing = false;
            });
        });
      },
      error: (err) => {
        console.error('[GoogleButtonComponent] Google login error:', err);
        this.isProcessing = false;
        alert('Возникла проблема с входом через Google. Пожалуйста, попробуйте ещё раз.');
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
