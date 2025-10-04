import { Component, inject, Inject, resource } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { DateFocus } from '../../shared/directives/date-focus';
import { Auth, BalanceService } from '../../core';
import { firstValueFrom } from 'rxjs';
import { NgIf } from '@angular/common';
import { NumeralPipe } from '../../core';

@Component({
  selector: 'app-balance',
  imports: [LucideAngularModule, DateFocus, NgIf, NumeralPipe],
  templateUrl: './balance.html',
  styleUrl: './balance.scss',
})
export class Balance {
  private balanceService = inject(BalanceService);
  private authService = inject(Auth);
  protected ICONS = icons;
  constructor() {}

  getAllTransactions = resource({
    loader: () => firstValueFrom(this.balanceService.getAllTransactions()),
  });

  getMe = resource({
    loader: () => firstValueFrom(this.authService.getMe()),
  });

  protected onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    console.log(input);
  }
}
