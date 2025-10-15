import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { IGetMeRes, ILoginRes } from '../interfaces';
import { from, Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Telegram } from './telegram';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private telegram = inject(Telegram);
  private router = inject(Router);
  private http = inject(HttpClient);

  /** Oddiy email + password orqali ro'yxatdan o'tish */
  register(
    email: string,
    telegram_id: string,
    password: string,
    password_confirmation: string
  ): Observable<ILoginRes> {
    return this.http
      .post<ILoginRes>(`${environment.apiUrl}/auth/register`, {
        email,
        telegram_id,
        password,
        password_confirmation,
      })
      .pipe(
        tap(async (res: ILoginRes): Promise<void> => {
          await this.telegram.setCloudItem('email', res.user.email);
          await this.telegram.setCloudItem('token', res.token);
          if (res.success) {
            this.router.navigateByUrl('/porfile');
          }
        })
      );
  }

  /** Oddiy email + password orqali login */
  login(email: string, password: string): Observable<ILoginRes> {
    return this.http.post<ILoginRes>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      tap(async (res: ILoginRes): Promise<void> => {
        await this.telegram.setCloudItem('email', res.user.email);
        await this.telegram.setCloudItem('token', res.token);
        if (res.success) {
          this.router.navigateByUrl('/porfile');
        }
      })
    );
  }

  /** Foydalanuvchi mavjudligini tekshirish */
  existUser(email: string): Observable<{ success: boolean; exist: boolean }> {
    return this.http.post<{ success: boolean; exist: boolean }>(
      `${environment.apiUrl}/auth/exist-user`,
      { email }
    );
  }

  /** Google orqali kirish */
  googleLogin(idToken: string, telegram_id: string): Observable<ILoginRes> {
    return this.http
      .post<ILoginRes>(`${environment.apiUrl}/auth/google`, { id_token: idToken, telegram_id })
      .pipe(
        switchMap((res: ILoginRes) => {
          // Telegram cloud storage'ga saqlash (async)
          return from(
            Promise.all([
              this.telegram.setCloudItem('email', res.user.email),
              this.telegram.setCloudItem('token', res.token),
            ]).then(() => res)
          );
        })
      );
  }

  getMe(): Observable<IGetMeRes> {
    return this.http.get<IGetMeRes>(`${environment.apiUrl}/auth/me`);
  }

  /** Chiqish (logout) */
  logout(): void {
    try {
      this.telegram.removeCloudItem('token').then(() => {
        this.router.navigate(['/auth']);
      });
    } catch (error) {
      console.error('Logout error: ' + error);
    }
  }

  /** Token mavjudligini tekshirish */
  async isLoggedIn(): Promise<boolean> {
    const token: string | null = await this.telegram.getCloudStorage('token');
    return !!token;
  }
}
