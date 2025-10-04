import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Telegram } from './core/services';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private telegram = inject(Telegram);

  ngOnInit(): void {
    this.telegram.init('#030303');
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach((input: Element) => {
        const element = input as HTMLElement;
        element.blur();
      });
    }
  }
}
