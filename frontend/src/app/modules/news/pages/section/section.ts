import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { Telegram } from '../../../../core';

@Component({
  selector: 'app-section',
  imports: [LucideAngularModule],
  templateUrl: './section.html',
  styleUrl: './section.scss',
})
export class Section implements OnInit, OnDestroy {
  private telegram = inject(Telegram);
  protected ICONS = icons;
  ngOnInit(): void {
    this.telegram.showBackButton('/news');
  }
  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/news');
  }
}
