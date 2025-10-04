// src/app/auth/auth.ts (faqat muhim qismi)
import { Component, AfterViewInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { GoogleIdentityService } from '../core/services/google-identity.service';

const GOOGLE_CLIENT_ID = '88711836385-9tn05j476kkggpqna9lqdtfc1qqpk4g6.apps.googleusercontent.com';

@Component({
  selector: 'app-auth',
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth implements AfterViewInit {
  private gis = inject(GoogleIdentityService);

  async ngAfterViewInit(): Promise<void> {
    try {
      // Initialize Google Identity once for the auth module
      await this.gis.init(GOOGLE_CLIENT_ID);
    } catch (err) {
      console.error('Auth: failed to init Google Identity SDK', err);
    }
  }
}
