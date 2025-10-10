import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Telegram } from '../../../../core';

import { FormsModule } from '@angular/forms';
import { TiptapEditorComponent } from '../../../../components';
@Component({
  selector: 'app-edit-theme',
  imports: [FormsModule, TiptapEditorComponent],
  templateUrl: './edit-theme.html',
  styleUrl: './edit-theme.scss',
  encapsulation: ViewEncapsulation.None,
})
export class EditTheme implements OnInit, OnDestroy {
  private telegram = inject(Telegram);
  ngOnInit(): void {
    this.telegram.showBackButton('/profile/my-topics');
  }
  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/profile/my-topics');
  }
}
