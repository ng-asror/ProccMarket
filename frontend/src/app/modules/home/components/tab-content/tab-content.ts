import { Component } from '@angular/core';
import { FormCard } from '../../../../components';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-tab-content',
  imports: [FormCard, LucideAngularModule],
  templateUrl: './tab-content.html',
  styleUrl: './tab-content.scss',
})
export class TabContent {
  ICONS = icons;
}
