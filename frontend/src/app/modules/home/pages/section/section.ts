import { Component, inject, OnDestroy, OnInit, resource, signal } from '@angular/core';
import { Layout } from '../../../../layout/layout';
import { ISectionsDashboard, Section, Telegram } from '../../../../core';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';
import { FormCard } from '../../../../components';

@Component({
  selector: 'app-section',
  imports: [Layout, RouterLink, LucideAngularModule, FormCard],
  templateUrl: './section.html',
  styleUrl: './section.scss',
})
export class SectionComponent implements OnInit, OnDestroy {
  private telegram = inject(Telegram);
  private sectionService = inject(Section);
  private activatedRoute = inject(ActivatedRoute);

  protected ICONS = icons;

  section = signal<ISectionsDashboard | null>(null);

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      const formId = params.get('form_id');
      firstValueFrom(this.sectionService.forumsDashboard()).then((res) => {
        const findSection = res.sections.find((item) => (item.id === +formId! ? item : null));
        this.section.set(findSection ?? null);
      });
    });
    this.telegram.showBackButton('/home');
  }
  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/home');
  }
}
