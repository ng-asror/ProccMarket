import { Component, inject, resource, signal } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { DateFocus } from '../../shared';
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
	protected pagination = signal<{current_page: number, last_page?: number}>({current_page: 1})
	constructor() { }

	getAllTransactions = resource({
		loader: () =>  firstValueFrom(this.balanceService.getAllTransactions(this.pagination().current_page, 5)).then((res) => {
			this.pagination.update(current => ({...current, last_page: res.data.pagination.last_page}))
		})
	});

	getMe = resource({
		loader: () => firstValueFrom(this.authService.getMe()),
	});

	protected onDateChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		console.log(input);
	}

	async export(): Promise<void> {
		try {
			const blob = await firstValueFrom(this.balanceService.getExport());
			const fileName = 'transactions.csv';
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export error:', error);
		}
	}


}
