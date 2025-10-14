import { HttpClient } from '@angular/common/http';
import { inject, Injectable, resource } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ISectionsDashboardRes, ISectionsRes } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class Section {
  private http = inject(HttpClient);

  allSections(): Observable<ISectionsRes> {
    return this.http.get<ISectionsRes>(`${environment.apiUrl}/sections`);
  }

  forumsDashboard(): Observable<ISectionsDashboardRes> {
    return this.http.get<ISectionsDashboardRes>(`${environment.apiUrl}/sections/dashboard`);
  }

  sections = resource({
    loader: () => firstValueFrom(this.allSections()),
  });
}
