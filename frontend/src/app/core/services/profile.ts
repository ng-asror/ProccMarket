import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { IMyTopics, IProfileRes } from '../interfaces';
interface updateProfileBody {
  name?: string;
  email?: string;
  description?: string;
  avatar?: string;
  cover?: string | null;
  password?: string;
  password_confirmation?: string;
}
@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<IProfileRes> {
    return this.http.get<IProfileRes>(`${environment.apiUrl}/auth/profile`);
  }

  updateProfile(req: updateProfileBody): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/auth/update`, req);
  }

  myTopics(): Observable<IMyTopics> {
    return this.http.get<IMyTopics>(`${environment.apiUrl}/auth/my-topics`);
  }
}
