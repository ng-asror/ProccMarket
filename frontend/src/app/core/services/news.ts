import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { INewsRes } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class News {
  constructor(private http: HttpClient) {}

  getAllNews(): Observable<INewsRes> {
    return this.http.get<INewsRes>(`${environment.apiUrl}/news`);
  }
}
