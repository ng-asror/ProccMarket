import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';
import { Telegram } from '../../../core';

@Component({
  selector: 'app-menubar',
  imports: [RouterLink, LucideAngularModule, RouterLinkActive],
  templateUrl: './menubar.html',
  styleUrl: './menubar.scss',
})
export class Menubar {
  private telegram = inject(Telegram);
  soon(): void {
    this.telegram.showAlert('Скоро');
  }
  protected icons = icons;
}
