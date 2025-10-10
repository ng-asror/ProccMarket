import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Telegram } from '../../../../core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-theme',
  imports: [TiptapEditorDirective, FormsModule],
  templateUrl: './edit-theme.html',
  styleUrl: './edit-theme.scss',
})
export class EditTheme implements OnInit, OnDestroy {
  private telegram = inject(Telegram);

  content = new Editor({
    extensions: [StarterKit],
  });
  value = '<p>Hello, Tiptap!</p>';
  ngOnInit(): void {
    this.telegram.showBackButton('/profile/my-topics');
  }
  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/profile/my-topics');
    this.content.destroy();
  }
}
