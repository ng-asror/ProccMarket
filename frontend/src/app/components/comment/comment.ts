import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { IComment, News, NumeralPipe, TopicService } from '../../core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { MomentModule } from 'ngx-moment';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-comment',
  imports: [NumeralPipe, MomentModule, LucideAngularModule, FormsModule],
  templateUrl: './comment.html',
  styleUrl: './comment.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Comment implements OnInit {
  private newsService = inject(News);
  private topicService = inject(TopicService);
  private route = inject(ActivatedRoute);

  commentType = input.required<'topic' | 'news'>({ alias: 'type' });
  commentInput = input.required<IComment>({ alias: 'comment' });
  commentReplay = input.required<{
    user: { id: number; name: string | null };
    role: string | null;
    comment: string;
  } | null>();

  protected ICONS = icons;
  pageId: string = '';
  comment = signal<IComment | null>(null);
  protected commentContent = signal<{ content: string; replay_id?: number }>({
    content: '',
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      this.pageId = params.get('id')!;
    });
  }

  ngOnInit(): void {
    this.comment.set(this.commentInput());
  }
  protected async commentLikeDislikToggle(comment_id: number, is_like: boolean): Promise<void> {
    await firstValueFrom(this.newsService.newsCommentLikeDislik(comment_id, is_like)).then(
      (res) => {
        this.comment.update((comment) => {
          if (!comment) return comment;

          if (comment.id === comment_id) {
            return {
              ...comment,
              likes_count: res.data.likes_count,
              dislikes_count: res.data.dislikes_count,
              user_reaction: res.data.user_reaction,
            };
          }
          if (comment.replies) {
            const updatedReplies = comment.replies.map((reply) => {
              if (reply.id === comment_id) {
                return {
                  ...reply,
                  likes_count: res.data.likes_count,
                  dislikes_count: res.data.dislikes_count,
                  user_reaction: res.data.user_reaction,
                };
              }
              return reply;
            });
            return {
              ...comment,
              replies: updatedReplies,
            };
          }
          return { ...comment };
        });
      }
    );
  }

  async createComment(): Promise<void> {
    if (this.commentType() === 'news') {
      await firstValueFrom(
        this.newsService.createComment(
          Number(this.pageId),
          this.commentContent().content,
          this.commentContent().replay_id
        )
      ).then((res) => {
        this.commentContent.set({ content: '', replay_id: undefined });
        this.comment.update((current) => {
          if (!current) return current;
          return { ...current, replies: [...(current.replies ?? []), res.data] };
        });
      });
    }
    if (this.commentType() === 'topic') {
      await firstValueFrom(
        this.topicService.createComment(
          Number(this.pageId),
          this.commentContent().content,
          this.commentContent().replay_id
        )
      ).then((res) => {
        this.commentContent.set({ content: '', replay_id: undefined });
        this.comment.update((current) => {
          if (!current) return current;
          return { ...current, replies: [...(current.replies ?? []), res.data] };
        });
      });
    }
  }
  protected reply(comment_id: number): void {
    console.log(comment_id);
    this.commentContent.update((current) => ({
      ...current,
      replay_id: current.replay_id === comment_id ? undefined : comment_id,
    }));
  }
}
