import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IAdsRes } from '../interfaces';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class Ads {
  private http = inject(HttpClient);

  getAds(): Observable<IAdsRes> {
    return this.http.get<IAdsRes>(`${environment.apiUrl}/public/banners`);
  }
}
