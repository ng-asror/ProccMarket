import { Component, inject, OnDestroy, OnInit, resource } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { News, Telegram } from '../../../../core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-section',
  imports: [LucideAngularModule, NgIf],
  templateUrl: './section.html',
  styleUrl: './section.scss',
})
export class Section implements OnInit, OnDestroy {
  private telegram = inject(Telegram);
  private newsService = inject(News);
  protected ICONS = icons;
  news_id: string = '';

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe((params) => {
      this.news_id = params.get('id')!;
    });
  }

  news = resource({
    loader: () => firstValueFrom(this.newsService.getNews(this.news_id)),
  });
  ngOnInit(): void {
    this.telegram.showBackButton('/news');
  }
  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/news');
  }
}
