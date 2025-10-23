import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Order {
	private http  = inject(HttpClient);

	order_list() {
		
	}
}
