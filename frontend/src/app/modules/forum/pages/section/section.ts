import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { FormCard } from '../../../../components';

@Component({
  selector: 'app-section',
  imports: [LucideAngularModule, FormCard],
  templateUrl: './section.html',
  styleUrl: './section.scss',
})
export class Section {
  protected ICONS = icons;
}
