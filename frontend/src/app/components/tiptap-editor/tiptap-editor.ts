import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  input,
  output,
  effect,
} from '@angular/core';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TiptapEditorComponent implements OnInit, OnDestroy {
  protected ICONS = icons;
  protected addUrl: string = '';

  value = input<string>('', { alias: 'editContent' });
  valueChange = output<string>({ alias: 'editorValue' });

  editor!: Editor;

  constructor() {
    effect(() => {
      const newValue = this.value();
      if (this.editor && newValue) {
        this.editor.commands.setContent(newValue, false);
      }
    });
  }

  ngOnInit(): void {
    this.editor = new Editor({
      extensions: [
        StarterKit,
        Image,
        Underline,
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        Link.configure({
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: {
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'text-blue-600 underline',
          },
        }),
        Placeholder.configure({
          placeholder: 'Введите текст...',
          includeChildren: true,
        }),
      ],
      onCreate: ({ editor }) => {
        const content = this.value();
        if (content) editor.commands.setContent(content);
      },
      onUpdate: ({ editor }) => {
        this.valueChange.emit(editor.getHTML());
      },
      editorProps: {
        attributes: {
          class: 'p-2 outline-hidden editor-content min-h-[200px]',
          spellCheck: 'true',
        },
      },
    });
  }

  protected cancel(): void {
    const dialog = document.getElementById('addurlModal') as HTMLDialogElement;
    dialog?.close();
  }

  protected confirmAddLink(): void {
    const dialog = document.getElementById('addurlModal') as HTMLDialogElement;
    dialog?.close();
    this.editor.chain().focus().extendMarkRange('link').setLink({ href: this.addUrl }).run();
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }
}
