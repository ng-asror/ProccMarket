import { Component, input } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { ISectionsDashboard, NumeralPipe } from '../../../../core';
import { RouterLink } from '@angular/router';
import { FormCard } from '../../../../components';

@Component({
  selector: 'app-tab-content',
  imports: [LucideAngularModule, RouterLink, FormCard],
  templateUrl: './tab-content.html',
  styleUrl: './tab-content.scss',
})
export class TabContent {
  sectionBlog = input.required<ISectionsDashboard>({ alias: 'section-blog' });
  ICONS = icons;
}
