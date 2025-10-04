import {
  Component,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { GoogleIdentityService } from '../../../core/services/google-identity.service';
import { Auth } from '../../../core/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'google-btn',
  standalone: true,
  imports: [CommonModule],
  template: `<div #container class="w-full flex justify-center"></div>`,
})
export class GoogleButtonComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) container!: ElementRef<HTMLDivElement>;

  @Input() theme = 'outline';
  @Input() size = 'large';
  @Input() width: string | number = '100%';

  @Output() credential = new EventEmitter<any>();

  private sub?: Subscription;

  constructor(
    private gis: GoogleIdentityService,
    private auth: Auth,
    private router: Router
  ) {}

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
      console.error(
        '[GoogleButtonComponent] Google init or Render error:',
        err
      );
    }
  }

  /**
   * Google'dan qaytgan credential tokenni backendga yuborish
   */
  private handleCredentialResponse(response: any): void {
    const idToken = response?.credential;
    const telegram_id = "12222512";
    if (!idToken) {
      console.warn('[GoogleButtonComponent] Empty Google ID token.');
      return;
    }

    console.info('[GoogleButtonComponent] Google ID token received, logging in...');

    this.auth.googleLogin(idToken, telegram_id).subscribe({
      next: (res) => {
        console.log('[GoogleButtonComponent] Google login success:', res);
        // Login muvaffaqiyatli bo‘lgach, foydalanuvchini bosh sahifaga yo‘naltiramiz
        window.location.href = '/';
      },
      error: (err) => {
        console.error('[GoogleButtonComponent] Google login error:', err);
        alert('Возникла проблема с входом через Google. Пожалуйста, попробуйте ещё раз.');
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
