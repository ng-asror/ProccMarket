import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ITransactionRes } from '../interfaces';
type TransactionTypes = ['pending' | 'completed' | 'rejected']
@Injectable({
	providedIn: 'root',
})
export class BalanceService {
	constructor(private http: HttpClient) { }

	getBalance(): Observable<any> {
		return this.http.get<any>(`${environment.apiUrl}/pay/crypto-bot/balance`);
	}

	getAllTransactions( page: number,per_page: number, status?: TransactionTypes, start_date?: string, end_date?: string): Observable<ITransactionRes> {
		let params = new HttpParams()
			.set('per_page', per_page)
			.set('page', page);

		if (start_date !== undefined) {
			params = params.set('start_date', start_date);
		}
		if (end_date !== undefined) {
			params = params.set('end_date', end_date);
		}

		return this.http.get<ITransactionRes>(`${environment.apiUrl}/transactions`, { params });
	}

	getExport(): Observable<any> {
		return this.http.get<any>(`${environment.apiUrl}/transactions/export`, { responseType: 'json' })
	}
}
