import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { DateFocus } from '../../shared/directives/date-focus';

@Component({
  selector: 'app-balance',
  imports: [LucideAngularModule, DateFocus],
  templateUrl: './balance.html',
  styleUrl: './balance.scss',
})
export class Balance {
  protected ICONS = icons;
  constructor() {}

  protected onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    console.log(input);
  }
}
