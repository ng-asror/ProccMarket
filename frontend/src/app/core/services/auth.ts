import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ILoginRes } from '../interfaces';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Telegram } from './telegram';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private telegram = inject(Telegram);
  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<ILoginRes> {
    return this.http
      .post<ILoginRes>(`${environment.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((res: ILoginRes) => {
          this.telegram.setCloudItem('email', res.user.email);
          this.telegram.setCloudItem('token', res.token);
        })
      );
  }

  existUser(email: string): Observable<{
    success: boolean;
    exist: boolean;
  }> {
    return this.http.post<{
      success: boolean;
      exist: boolean;
    }>(`${environment.apiUrl}/auth/exist-user`, { email });
  }

  logout(): void {
    try {
      this.telegram.removeCloudItem('token').then(() => {
        this.router.navigate(['/auth']);
      });
    } catch (error) {
      console.error(error);
    }
  }

  async isLoggedIn(): Promise<boolean> {
    const email: string | null = await this.telegram.getCloudStorage('token');
    return email ? true : false;
  }
}
