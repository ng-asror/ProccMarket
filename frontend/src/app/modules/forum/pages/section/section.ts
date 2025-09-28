import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-section',
  imports: [LucideAngularModule],
  templateUrl: './section.html',
  styleUrl: './section.scss',
})
export class Section {
  protected ICONS = icons;
}
