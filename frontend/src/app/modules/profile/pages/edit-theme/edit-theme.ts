import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Section, Telegram } from '../../../../core';

import { FormsModule } from '@angular/forms';
import { TiptapEditorComponent } from '../../../../components';
@Component({
  selector: 'app-edit-theme',
  imports: [FormsModule, TiptapEditorComponent, FormsModule],
  templateUrl: './edit-theme.html',
  styleUrl: './edit-theme.scss',
})
export class EditTheme implements OnInit, OnDestroy {
  private telegram = inject(Telegram);
  private sectionsService = inject(Section);
  selectMainSection: string = 'all';
  selectSection: string = 'all';
  previewUrl = signal<string | ArrayBuffer | null>(null);

  getSections = this.sectionsService.sections;

  ngOnInit(): void {
    this.telegram.showBackButton('/profile/my-topics');
  }

  protected onFileSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.telegram.showAlert('Файл не должен превышать 2 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl.set(reader.result);
    };
    reader.readAsDataURL(file);
  }

  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/profile/my-topics');
  }
}
