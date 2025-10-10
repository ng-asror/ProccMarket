import { Component, OnInit, OnDestroy } from '@angular/core';

import { Content, Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';

// import { TextStyle } from '@tiptap/extension-text-style';
// import { Color } from '@tiptap/extension-color';
// import { Table } from '@tiptap/extension-table';
// import { TableRow } from '@tiptap/extension-table-row';
// import { TableCell } from '@tiptap/extension-table-cell';
// import { TableHeader } from '@tiptap/extension-table-header';
import { TextAlign } from '@tiptap/extension-text-align';
import { TiptapEditorDirective } from 'ngx-tiptap';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-tiptap-editor',
  templateUrl: './tiptap-editor.html',
  styleUrls: ['./tiptap-editor.scss'],
  imports: [FormsModule, TiptapEditorDirective, NgClass, LucideAngularModule],
})
export class TiptapEditorComponent implements OnInit, OnDestroy {
  protected ICONS = icons;
  protected addUrl: string = '';
  ngOnInit(): void {}
  value: Content = ``;

  editor = new Editor({
    extensions: [
      StarterKit,
      Image,
      Link,
      Underline,
      Placeholder.configure({
        placeholder: 'Введите текст...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      Link.configure({
        openOnClick: false, // linkni editor ichida bosganda o‘tmasligi uchun
        autolink: true, // avtomatik ravishda https:// ni aniqlaydi
        linkOnPaste: true, // link joylashtirilganda avtomatik o‘rnatadi
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-blue-600 underline',
        },
      }),

      // Color,
      // Table.configure({
      //   resizable: true,
      // }),
      // TableRow,
      // TableCell,
      // TableHeader,
    ],
    editorProps: {
      attributes: {
        class: 'p-2 outline-hidden min-h-[200px]',
        spellCheck: 'false',
      },
    },
  });

  handleValueChange(value: Content): void {
    this.value = value;
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }
}
