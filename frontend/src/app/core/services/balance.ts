import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { ITransactionRes } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class BalanceService {
  constructor(private http: HttpClient) {}

  getBalance(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/pay/crypto-bot/balance`);
  }

  getAllTransactions(): Observable<ITransactionRes> {
    return this.http.get<ITransactionRes>(`${environment.apiUrl}/transactions`);
  }
}
