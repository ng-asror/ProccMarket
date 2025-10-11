import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ResultData } from '../interfaces';

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

  delete(topic_id): Observable<Result> {}
}
