import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private http = inject(HttpClient);

  writeReview(star: number, comment: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/reviews`, { star, comment });
  }
}
