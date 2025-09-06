import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-balance',
  imports: [LucideAngularModule],
  templateUrl: './balance.html',
  styleUrl: './balance.scss',
})
export class Balance {
  protected ICONS = icons;
}
