import { Component, inject, resource } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { AccordionItem } from '../../components';
import { News } from '../../../../core';
import { firstValueFrom } from 'rxjs';
import { Menubar, Navbar } from '../../../../components';

@Component({
  selector: 'app-main',
  imports: [LucideAngularModule, AccordionItem, Navbar, Menubar],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {
  private newsService = inject(News);
  protected ICONS = icons;

  news = resource({
    loader: () => firstValueFrom(this.newsService.getAllNews()),
  }).asReadonly();
}
