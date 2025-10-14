import { Component, input } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { ISectionsDashboard } from '../../../../core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tab-content',
  imports: [LucideAngularModule, RouterLink],
  templateUrl: './tab-content.html',
  styleUrl: './tab-content.scss',
})
export class TabContent {
  sectionBlog = input.required<ISectionsDashboard>({ alias: 'section-blog' });
  ICONS = icons;
}
