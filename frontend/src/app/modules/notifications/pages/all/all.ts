import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-all',
  imports: [LucideAngularModule],
  templateUrl: './all.html',
  styleUrl: './all.scss',
})
export class All {
  protected ICONS = icons;
}
