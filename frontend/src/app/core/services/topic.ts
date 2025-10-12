import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ITopicRes, ResultData } from '../interfaces';
import { Result } from '../interfaces/result';

@Injectable({
  providedIn: 'root',
})
export class Topic {
  private http = inject(HttpClient);

  create(section_id: number, title: string, content: string, image: File): Observable<ResultData> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('image', image);
    return this.http.post<ResultData>(
      `${environment.apiUrl}/topics/section/${section_id}`,
      formData
    );
  }

  delete(topic_id: number): Observable<ResultData> {
    return this.http.delete<ResultData>(`${environment.apiUrl}/topics/${topic_id}`);
  }

  update(topic_id: number, title: string, content: string, image: File | null): Observable<Result> {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (image) {
      formData.append('image', image);
    }
    return this.http.put<Result>(`${environment.apiUrl}/topics/${topic_id}`, formData);
  }

  info(topic_id: number): Observable<ITopicRes> {
    return this.http.get<ITopicRes>(`${environment.apiUrl}/topics/${topic_id}`);
  }
}
