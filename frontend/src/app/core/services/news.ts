import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { INewsInfoRes, INewsRes } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class News {
  constructor(private http: HttpClient) {}

  getAllNews(): Observable<INewsRes> {
    return this.http.get<INewsRes>(`${environment.apiUrl}/news`);
  }

  getNews(id: string): Observable<INewsInfoRes> {
    return this.http.get<INewsInfoRes>(`${environment.apiUrl}/news/${id}`);
  }

  getComments(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/news/${id}/comments`);
  }
}
