import { Component, inject, OnInit, resource, signal } from '@angular/core';
import { HomeSlide, TabContent, TabSlide } from './components';
import { Layout } from '../../layout/layout';
import { ISectionsDashboard, Section } from '../../core';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [TabContent, HomeSlide, TabSlide, Layout, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
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
