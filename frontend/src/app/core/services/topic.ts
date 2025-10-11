import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class Topic {
  private http = inject(HttpClient);

  create(section_id: number, title: string, content: string, image: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/topics/section/${section_id}`, {
      title,
      content,
      image,
    });
  }
}
