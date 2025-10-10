import { HttpClient } from '@angular/common/http';
import { inject, Injectable, resource } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ISectionsRes } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class Section {
  private http = inject(HttpClient);

  allSections(): Observable<ISectionsRes> {
    return this.http.get<ISectionsRes>(`${environment.apiUrl}/sections`);
  }
  sections = resource({
    loader: () => firstValueFrom(this.allSections()),
  });
}
