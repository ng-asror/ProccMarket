import { Component, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { Section, Telegram, Topic } from '../../../../core';

import { FormsModule } from '@angular/forms';
import { TiptapEditorComponent } from '../../../../components';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
@Component({
  selector: 'app-edit-theme',
  imports: [FormsModule, TiptapEditorComponent, FormsModule],
  templateUrl: './edit-theme.html',
  styleUrl: './edit-theme.scss',
})
export class EditTheme implements OnInit, OnDestroy {
  private telegram = inject(Telegram);
  private router = inject(Router);
  private topic = inject(Topic);
  private sectionsService = inject(Section);

  selectSection: number = 0;
  titleTheme: string = '';
  previewUrl = signal<string | ArrayBuffer | null>(null);
  content: string = '';
  themeImg = signal<File | null>(null);

  getSections = this.sectionsService.sections;

  ngOnInit(): void {
    this.telegram.showBackButton('/profile/my-topics');
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
    console.log(this.themeImg()!);

    await firstValueFrom(
      this.topic.create(Number(this.selectSection), this.titleTheme, this.content, this.themeImg()!)
    ).then(() => {
      this.router.navigate(['/profile/my-topics']);
    });
  }

  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/profile/my-topics');
  }
}
