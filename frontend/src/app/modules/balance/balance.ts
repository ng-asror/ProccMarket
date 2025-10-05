import { Component, inject, resource, signal } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { DateFocus } from '../../shared';
import { AmDateFormatPipe, Auth, BalanceService, TTransactionTypes } from '../../core';
import { firstValueFrom } from 'rxjs';
import { NgFor, NgIf } from '@angular/common';
import { NumeralPipe } from '../../core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-balance',
  imports: [
    LucideAngularModule,
    DateFocus,
    NgIf,
    NumeralPipe,
    NgFor,
    FormsModule,
    AmDateFormatPipe,
  ],
  templateUrl: './balance.html',
  styleUrl: './balance.scss',
})
export class Balance {
  private balanceService = inject(BalanceService);
  private authService = inject(Auth);
  protected ICONS = icons;
  protected pagination = signal<{ current_page: number; last_page?: number }>({ current_page: 1 });
  protected sortFilter: {
    status: TTransactionTypes | 'all';
    start_date: string;
    end_date: string;
  } = { status: 'all', start_date: '', end_date: '' };
  constructor() {}

  getAllTransactions = resource({
    loader: async () =>
      await firstValueFrom(
        this.balanceService.getAllTransactions(
          this.pagination().current_page,
          5,
          this.sortFilter.status === 'all' ? undefined : this.sortFilter.status,
          this.sortFilter.start_date,
          this.sortFilter.end_date
        )
      ).then((res) => {
        this.pagination.update((current) => ({
          ...current,
          last_page: res.data.pagination.last_page,
        }));
        return res;
      }),
  });

  getMe = resource({
    loader: () => firstValueFrom(this.authService.getMe()),
  });
}
