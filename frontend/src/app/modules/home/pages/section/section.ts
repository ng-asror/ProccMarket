import { Component, inject, OnDestroy, OnInit, resource } from '@angular/core';
import { Layout } from '../../../../layout/layout';
import { Section, Telegram } from '../../../../core';
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

  protected section = resource({
    loader: () =>
      firstValueFrom(this.sectionService.forumsDashboard()).then((res) => {
        const param = this.activatedRoute.snapshot.params['form_id'];
        const findSection = res.sections.find((item) => (item.id === +param ? item : null));
        console.log(findSection);
        return findSection;
      }),
  }).asReadonly();

  ngOnInit(): void {
    this.telegram.showBackButton('/home');
  }
  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/home');
  }
}
