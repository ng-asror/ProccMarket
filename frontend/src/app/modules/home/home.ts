import { Component, inject, resource, signal } from '@angular/core';
import { HomeSlide, TabContent, TabSlide } from './components';
import { Layout } from '../../layout/layout';
import { ISectionsDashboard, Section } from '../../core';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [TabContent, HomeSlide, TabSlide, Layout],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private sectionService = inject(Section);
  private router = inject(Router);
  private activRoute = inject(ActivatedRoute);

  section = signal<ISectionsDashboard | null>(null);

  private sections = resource({
    loader: async () =>
      await firstValueFrom(this.sectionService.forumsDashboard()).then((res) => {}),
  }).asReadonly();

  constructor() {}
}
