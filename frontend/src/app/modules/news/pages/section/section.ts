import { Component, inject, OnDestroy, OnInit, resource, signal } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { News, Telegram } from '../../../../core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MomentModule } from 'ngx-moment';
import { NgForOf, NgIf } from '@angular/common';
import { AmDateFormatPipe, NumeralPipe } from '../../../../core/pipes';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-section',
  imports: [
    LucideAngularModule,
    NgIf,
    NgForOf,
    MomentModule,
    AmDateFormatPipe,
    NumeralPipe,
    FormsModule,
  ],
  templateUrl: './section.html',
  styleUrl: './section.scss',
})
export class Section implements OnInit, OnDestroy {
  private telegram = inject(Telegram);
  private newsService = inject(News);
  protected ICONS = icons;
  protected comment = signal<{ content: string; replay_id?: number }>({
    content: '',
  });
  protected newsCounts = signal<{
    user_reaction: 'like' | null;
    likes_count: number;
    dislikes_count: number;
    comments: number;
    share_count: number;
  }>({ user_reaction: null, likes_count: 0, dislikes_count: 0, comments: 0, share_count: 0 });

  news_id: string = '';
  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe((params) => {
      this.news_id = params.get('id')!;
    });
  }

  news = resource({
    loader: async () =>
      await firstValueFrom(this.newsService.getNews(this.news_id)).then((res) => {
        this.newsCounts.set({
          user_reaction: res.data.user_reaction,
          likes_count: res.data.likes_count,
          dislikes_count: res.data.dislikes_count,
          comments: res.data.comments_count,
          share_count: res.data.shares_count,
        });
        return res;
      }),
  });

  comments = resource({
    loader: () => firstValueFrom(this.newsService.getComments(this.news_id)),
  });

  ngOnInit(): void {
    this.telegram.showBackButton('/news');
  }
  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/news');
  }

  async newToggleLike(id: number): Promise<void> {
    await firstValueFrom(this.newsService.newsToggleLike(id)).then((res) => {
      this.newsCounts.update((current) => ({
        ...current,
        likes_count: res.data.likes_count,
        user_reaction: res.data.user_reaction,
      }));
    });
  }

  async createComment(): Promise<void> {
    await firstValueFrom(
      this.newsService.createComment(Number(this.news_id), this.comment().content)
    ).then((res) => {
      this.comment.set({ content: '', replay_id: undefined });
      this.comments.reload();
    });
  }
}
