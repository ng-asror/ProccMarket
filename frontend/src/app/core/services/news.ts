import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ILikeDislikeRes, INewsCommentsRes, INewsInfoRes, INewsRes } from '../interfaces';

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

  getComments(id: string): Observable<INewsCommentsRes> {
    return this.http.get<INewsCommentsRes>(`${environment.apiUrl}/news/${id}/comments`);
  }

  newsToggleLike(news_id: number): Observable<ILikeDislikeRes> {
    return this.http.post<ILikeDislikeRes>(`${environment.apiUrl}/news/${news_id}/like`, {
      is_like: true,
    });
  }

  createComment(news_id: number, content: string, replay_id?: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/news/${news_id}/comments`, {
      content,
      replay_id,
    });
  }
}
