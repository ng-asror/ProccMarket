import { Component, inject, resource, signal } from '@angular/core';
import { ISectionsDashboard, Section } from '../../../../core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Layout } from '../../../../layout/layout';
import { HomeSlide, TabContent, TabSlide } from '../../components';

@Component({
  selector: 'app-main',
  imports: [Layout, HomeSlide, TabSlide, TabContent],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {
  private sectionService = inject(Section);
  private route = inject(ActivatedRoute);

  sections = this.sectionService.sections.asReadonly();
  sectionBlog = signal<ISectionsDashboard[] | null>(null);
  protected sectionsDashboard = resource({
    loader: () =>
      firstValueFrom(this.sectionService.forumsDashboard()).then((res) => {
        const paramValue = this.route.snapshot.queryParamMap.get('forms');
        const sortSection = res.sections.filter(
          (item) => item.parent_id === Number(paramValue) && item.topics_count !== 0
        );
        this.sectionBlog.set(sortSection.length ? sortSection : null);
        return res;
      }),
  }).asReadonly();

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const paramValue = params.get('forms');
      const data = this.sectionsDashboard.value();
      if (data && paramValue) {
        const sortSection = data.sections.filter(
          (item) => item.parent_id === Number(paramValue) && item.topics_count !== 0
        );
        this.sectionBlog.set(sortSection.length ? sortSection : null);
      }
    });
  }
}
