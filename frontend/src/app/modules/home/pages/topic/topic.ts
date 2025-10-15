import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  resource,
  signal,
} from '@angular/core';
import { AmDateFormatPipe, NumeralPipe, Telegram, TopicService } from '../../../../core';
import { ActivatedRoute } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Comment } from '../../../../components';
import { MomentModule } from 'ngx-moment';

@Component({
  selector: 'app-topic',
  imports: [LucideAngularModule, NumeralPipe, FormsModule, Comment, MomentModule, AmDateFormatPipe],
  templateUrl: './topic.html',
  styleUrl: './topic.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Topic implements OnInit, OnDestroy {
  private telegram = inject(Telegram);
  private topicService = inject(TopicService);
  private activatedRoute = inject(ActivatedRoute);

  protected ICONS = icons;
  protected comment = signal<{ content: string; replay_id?: number }>({
    content: '',
  });

  protected topic_id: string = '';
  constructor() {
    this.activatedRoute.paramMap.subscribe((params) => {
      this.topic_id = params.get('id')!;
    });
  }

  topic = resource({
    loader: () => firstValueFrom(this.topicService.info(Number(this.topic_id))),
  });
  comments = resource({
    loader: () => firstValueFrom(this.topicService.comments(this.topic_id)),
  });

  ngOnInit(): void {
    this.telegram.BackButton.show();
    this.telegram.BackButton.onClick(() => history.back());
  }

  async topicToggleLike(id: number, is_like: boolean): Promise<void> {
    await firstValueFrom(this.topicService.topicLikeDislike(id, is_like)).then((res) => {
      this.topic.update((current) => {
        if (!current) return;
        return {
          ...current,
          topic: {
            ...current.topic,
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
      this.topicService.createComment(Number(this.topic_id), this.comment().content)
    ).then((res) => {
      this.comment.set({ content: '', replay_id: undefined });
      this.comments.update((comments) => {
        if (!comments) return comments;
        return {
          ...comments,
          data: [res.data, ...(comments.data ?? [])],
        };
      });
      this.topic.update((current) => {
        if (!current) return;
        return {
          ...current,
          data: {
            ...current.topic,
            posts_count: current.topic.posts_count + 1,
          },
        };
      });
    });
  }

  ngOnDestroy(): void {
    this.telegram.BackButton.hide();
    this.telegram.BackButton.offClick(() => history.back());
  }
}
