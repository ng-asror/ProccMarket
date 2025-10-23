import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Section, Telegram, TopicService } from '../../../../core';

import { FormsModule } from '@angular/forms';
import { TiptapEditorComponent } from '../../../../components';
import { firstValueFrom } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-edit-theme',
  imports: [FormsModule, TiptapEditorComponent, FormsModule],
  templateUrl: './edit-theme.html',
  styleUrl: './edit-theme.scss',
})
export class EditTheme implements OnInit, OnDestroy {
  private telegram = inject(Telegram);
  private router = inject(Router);
  private topicService = inject(TopicService);
  private sectionsService = inject(Section);
  private route = inject(ActivatedRoute);
  selectSection: number = 0;
  topic_id: string | null = null;
  titleTheme: string = '';
  previewUrl = signal<string | ArrayBuffer | null>(null);
  content: string = '';
  themeImg = signal<File | null>(null);

  getSections = this.sectionsService.sections;

  async ngOnInit(): Promise<void> {
    this.telegram.showBackButton('/profile/my-topics');
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id && !isNaN(Number(id))) {
        this.topic_id = id;
      } else {
        this.topic_id = null;
      }
    });
    if (this.topic_id) {
      await firstValueFrom(this.topicService.info(Number(this.topic_id))).then((res) => {
        this.selectSection = res.topic.section.id;
        this.titleTheme = res.topic.title;
        this.previewUrl.set(res.topic.image_url);
        this.content = res.topic.content;
      });
    }
  }
  editorValue(event: string): void {
    this.content = event;
  }

  protected onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      this.telegram.showAlert('Файл не должен превышать 2 МБ');
      return;
    }
    this.themeImg.set(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result);
    };
    reader.readAsDataURL(file);
  }
  async submit(): Promise<void> {
    await firstValueFrom(
      this.topicService.create(
        Number(this.selectSection),
        this.titleTheme,
        this.content,
        this.themeImg()!
      )
    ).then(() => {
      this.router.navigate(['/profile/my-topics']);
    });
  }

  async update(): Promise<void> {
    await firstValueFrom(
      this.topicService.update(
        Number(this.topic_id),
        this.titleTheme,
        this.content,
        this.themeImg()
      )
    ).then(() => {
      this.router.navigate(['/profile/my-topics']);
    });
  }

  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/profile/my-topics');
  }
}
