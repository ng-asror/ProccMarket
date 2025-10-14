import { Component, inject, resource, signal } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { DateFocus } from '../../shared';
import { AmDateFormatPipe, Auth, BalanceService, Telegram, TTransactionTypes } from '../../core';
import { firstValueFrom } from 'rxjs';
import { NumeralPipe } from '../../core';
import {
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Layout } from '../../layout/layout';

@Component({
  selector: 'app-balance',
  imports: [
    LucideAngularModule,
    DateFocus,
    NumeralPipe,
    FormsModule,
    AmDateFormatPipe,
    ReactiveFormsModule,
    Layout,
  ],
  templateUrl: './balance.html',
  styleUrl: './balance.scss',
})
export class Balance {
  private balanceService = inject(BalanceService);
  private authService = inject(Auth);
  private telegram = inject(Telegram);

  protected isSpinning = false;
  protected ICONS = icons;
  protected withdrawalsForm: FormGroup;
  protected topUpAmount!: number;
  protected pagination = signal<{ current_page: number; last_page?: number }>({ current_page: 1 });
  protected sortFilter: {
    status: TTransactionTypes | 'all';
    start_date: string;
    end_date: string;
  } = { status: 'all', start_date: '', end_date: '' };
  constructor(private fb: NonNullableFormBuilder) {
    this.withdrawalsForm = this.fb.group({
      amount: [
        [
          Validators.required,
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
          Validators.maxLength(60),
          Validators.min(20),
        ],
      ],
      requisites: ['', [Validators.required, Validators.maxLength(60)]],
    });
  }

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

  increasePage(type: 'next' | 'prev') {
    if (type === 'next' && this.pagination().current_page < this.pagination().last_page!) {
      this.pagination.update((state) => ({
        ...state,
        current_page: state.current_page + 1,
      }));
      this.getAllTransactions.reload();
    }

    if (type === 'prev' && this.pagination().current_page > 1) {
      this.pagination.update((state) => ({
        ...state,
        current_page: state.current_page - 1,
      }));
      this.getAllTransactions.reload();
    }
  }

  getMe = resource({
    loader: () =>
      firstValueFrom(this.authService.getMe()).then((res) => {
        this.withdrawalsForm.get('amount')?.addValidators(Validators.max(Number(res.user.balance)));
        this.withdrawalsForm.get('amount')?.updateValueAndValidity();
        this.isSpinning = false;
        return res;
      }),
  });

  async submit(): Promise<void> {
    if (this.withdrawalsForm.valid) {
      const data = this.withdrawalsForm.getRawValue();
      await firstValueFrom(this.balanceService.withdrawals(data))
        .then(() => {
          this.getMe.reload();
          this.getAllTransactions.reload();
        })
        .catch((error) => {
          if (error.status === 403) {
            const nextWithdrawal = error.error.next_withdrawal_available_at;
            const dateObj = new Date(nextWithdrawal);
            const formatted = dateObj.toLocaleString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            });
            this.telegram.showAlert(
              `Вывод средств возможен только через 30 дней после вашего последнего депозита. Следующее снятие доступно: ${formatted}`
            );
          }
        });
    } else {
      this.withdrawalsForm.markAllAsTouched();
    }
  }
  protected async createInvoice(): Promise<void> {
    if (!this.topUpAmount) return;
    await firstValueFrom(this.balanceService.createInvoice(this.topUpAmount)).then((res) => {
      const dialog: HTMLDialogElement | null = document.getElementById(
        'topUp'
      ) as HTMLDialogElement;
      this.telegram.open(res.data.invoice.pay_url);
      dialog?.close();
    });
  }

  onReloadClick() {
    this.isSpinning = true;
    this.getMe.reload();
  }
}
