import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnDestroy,
  OnInit,
  resource,
  signal,
} from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { News, Telegram } from '../../../../core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MomentModule } from 'ngx-moment';
import { AmDateFormatPipe, NumeralPipe } from '../../../../core/pipes';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-section',
  imports: [LucideAngularModule, MomentModule, AmDateFormatPipe, NumeralPipe, FormsModule],
  templateUrl: './section.html',
  styleUrl: './section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Section implements OnInit, OnDestroy {
  private telegram = inject(Telegram);
  private newsService = inject(News);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  protected ICONS = icons;
  protected comment = signal<{ content: string; replay_id?: number }>({
    content: '',
  });

  news_id: string = '';
  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.news_id = params.get('id')!;
    });
  }

  news = resource({
    loader: async () => await firstValueFrom(this.newsService.getNews(this.news_id)),
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

  async newToggleLike(id: number, is_like: boolean): Promise<void> {
    await firstValueFrom(this.newsService.newsToggleLike(id, is_like)).then((res) => {
      this.news.update((current) => {
        if (!current) return;
        return {
          ...current,
          data: {
            ...current.data,
            user_reaction: res.data.user_reaction,
            likes_count: res.data.likes_count,
            dislikes_count: res.data.dislikes_count,
          },
        };
      });
    });
  }

  async createComment(): Promise<void> {
    await firstValueFrom(
      this.newsService.createComment(Number(this.news_id), this.comment().content)
    ).then((res) => {
      this.comment.set({ content: '', replay_id: undefined });
      this.comments.update((comments) => {
        if (!comments) return comments;
        return {
          ...comments,
          data: [res.data, ...(comments.data ?? [])],
        };
      });
      this.news.update((current) => {
        if (!current) return;
        return {
          ...current,
          data: {
            ...current.data,
            comments_count: current.data.comments_count + 1,
          },
        };
      });
    });
  }
  protected async commentLikeDislikToggle(comment_id: number, is_like: boolean): Promise<void> {
    await firstValueFrom(this.newsService.newsCommentLikeDislik(comment_id, is_like)).then(
      (res) => {
        this.comments.update((current) => {
          if (!current) return;
          return {
            ...current,
            data: current.data.map((comment) => {
              if (comment.id === comment_id) {
                return {
                  ...comment,
                  likes_count: res.data.likes_count,
                  user_reaction: res.data.user_reaction,
                  dislikes_count: res.data.dislikes_count,
                };
              }
              return comment;
            }),
          };
        });
      }
    );
  }
}
