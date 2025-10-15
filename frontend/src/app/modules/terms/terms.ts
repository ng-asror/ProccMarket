import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Telegram } from '../../core';

@Component({
  selector: 'app-terms',
  imports: [],
  templateUrl: './terms.html',
  styleUrl: './terms.scss',
})
export class Terms implements OnInit, OnDestroy {
  private telegram = inject(Telegram);

  ngOnInit(): void {
    this.telegram.showBackButton('/profile');
  }
  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/profile');
  }
}
