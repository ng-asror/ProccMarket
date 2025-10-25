import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SocketService, Telegram } from './core/services';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private socketService = inject(SocketService);

  private telegram = inject(Telegram);
  protected readonly title = signal('frontend');

  ngOnInit(): void {
    this.telegram.init('#030303');
    setTimeout(async () => {
      const token = await this.telegram.getCloudStorage('token');
      if (token) {
        this.socketService.initSocket(token);
      }
    }, 1000);
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
