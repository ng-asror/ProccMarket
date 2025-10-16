import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Telegram } from '../../core';

@Component({
  selector: 'app-cooperation',
  imports: [],
  templateUrl: './cooperation.html',
  styleUrl: './cooperation.scss',
})
export class Cooperation implements OnInit, OnDestroy {
  private telegram = inject(Telegram);

  ngOnInit(): void {
    this.telegram.BackButton.show();
    this.telegram.BackButton.onClick(() => history.back());
  }
  ngOnDestroy(): void {
    this.telegram.BackButton.offClick(() => history.back());
    this.telegram.BackButton.hide();
  }
}
