import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { IProfileRes } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<IProfileRes> {
    return this.http.get<IProfileRes>(`${environment.apiUrl}/auth/profile`);
  }
}
