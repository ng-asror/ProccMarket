import { ChangeDetectorRef, Component, ViewEncapsulation, type AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import {
  type EditorConfig,
  ClassicEditor,
  Autosave,
  Essentials,
  Paragraph,
  ImageInsertViaUrl,
  ImageBlock,
  ImageToolbar,
  AutoImage,
  ImageUpload,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageTextAlternative,
  List,
  ListProperties,
  Table,
  TableToolbar,
  TableCaption,
  TableCellProperties,
  TableColumnResize,
  TableProperties,
  TodoList,
  ImageUtils,
  ImageEditing,
  Heading,
  Link,
  AutoLink,
  BlockQuote,
  Bookmark,
  CodeBlock,
  Indent,
  IndentBlock,
  Alignment,
  ImageInsert,
  PictureEditing,
  ShowBlocks,
  GeneralHtmlSupport,
  HtmlEmbed,
  HtmlComment,
  FullPage,
} from 'ckeditor5';
import { Uploadcare, UploadcareImageEdit, SourceEditingEnhanced } from 'ckeditor5-premium-features';

import translations from 'ckeditor5/translations/ru.js';
import premiumFeaturesTranslations from 'ckeditor5-premium-features/translations/ru.js';

const LICENSE_KEY =
  'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NjA4MzE5OTksImp0aSI6ImFhYTNmYWNlLTAwM2EtNGY3ZC05ZmU0LTM0YjA3N2U2OWFjMSIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6ImY5MjllODdiIn0.TOPe8mFMVWqLg1y2cCd6ASZvcwwRvl-CmwvALD4iKoVmgy3frNKaVBpX3vpWQN4U_9-HF9_ZgaoFkI0HOQd0uw';

const UPLOADCARE_PUBKEY = 'f4715f244fe793c3705e';

@Component({
  selector: 'app-ckeditor',
  imports: [CommonModule, CKEditorModule],
  templateUrl: './ckeditor.html',
  styleUrls: ['./ckeditor.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class Ckeditor implements AfterViewInit {
  constructor(private changeDetector: ChangeDetectorRef) {}

  public isLayoutReady = false;
  public Editor = ClassicEditor;
  public config: EditorConfig = {};
  public ngAfterViewInit(): void {
    this.config = {
      toolbar: {
        items: [
          'undo',
          'redo',
          '|',
          'sourceEditingEnhanced',
          'showBlocks',
          '|',
          'heading',
          '|',
          'link',
          'bookmark',
          'insertImage',
          'insertTable',
          'blockQuote',
          'codeBlock',
          'htmlEmbed',
          '|',
          'alignment',
          '|',
          'bulletedList',
          'numberedList',
          'todoList',
          'outdent',
          'indent',
        ],
        shouldNotGroupWhenFull: false,
      },
      plugins: [
        Alignment,
        AutoImage,
        AutoLink,
        Autosave,
        BlockQuote,
        Bookmark,
        CodeBlock,
        Essentials,
        FullPage,
        GeneralHtmlSupport,
        Heading,
        HtmlComment,
        HtmlEmbed,
        ImageBlock,
        ImageCaption,
        ImageEditing,
        ImageInsert,
        ImageInsertViaUrl,
        ImageResize,
        ImageStyle,
        ImageTextAlternative,
        ImageToolbar,
        ImageUpload,
        ImageUtils,
        Indent,
        IndentBlock,
        Link,
        List,
        ListProperties,
        Paragraph,
        PictureEditing,
        ShowBlocks,
        SourceEditingEnhanced,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableProperties,
        TableToolbar,
        TodoList,
        Uploadcare,
        UploadcareImageEdit,
      ],
      heading: {
        options: [
          {
            model: 'paragraph',
            title: 'Paragraph',
            class: 'ck-heading_paragraph',
          },
          {
            model: 'heading1',
            view: 'h1',
            title: 'Heading 1',
            class: 'ck-heading_heading1',
          },
          {
            model: 'heading2',
            view: 'h2',
            title: 'Heading 2',
            class: 'ck-heading_heading2',
          },
          {
            model: 'heading3',
            view: 'h3',
            title: 'Heading 3',
            class: 'ck-heading_heading3',
          },
          {
            model: 'heading4',
            view: 'h4',
            title: 'Heading 4',
            class: 'ck-heading_heading4',
          },
          {
            model: 'heading5',
            view: 'h5',
            title: 'Heading 5',
            class: 'ck-heading_heading5',
          },
          {
            model: 'heading6',
            view: 'h6',
            title: 'Heading 6',
            class: 'ck-heading_heading6',
          },
        ],
      },
      htmlSupport: {
        allow: [
          {
            name: /^.*$/,
            styles: true,
            attributes: true,
            classes: true,
          },
        ],
      },
      image: {
        toolbar: [
          'toggleImageCaption',
          'imageTextAlternative',
          '|',
          'imageStyle:alignBlockLeft',
          'imageStyle:block',
          'imageStyle:alignBlockRight',
          '|',
          'resizeImage',
          '|',
          'uploadcareImageEdit',
        ],
        styles: {
          options: ['alignBlockLeft', 'block', 'alignBlockRight'],
        },
      },
      initialData: '',
      language: 'ru',
      licenseKey: LICENSE_KEY,
      link: {
        addTargetToExternalLinks: true,
        defaultProtocol: 'https://',
        decorators: {
          toggleDownloadable: {
            mode: 'manual',
            label: 'Downloadable',
            attributes: {
              download: 'file',
            },
          },
        },
      },
      list: {
        properties: {
          styles: true,
          startIndex: true,
          reversed: true,
        },
      },
      placeholder: 'Type or paste your content here!',
      table: {
        contentToolbar: [
          'tableColumn',
          'tableRow',
          'mergeTableCells',
          'tableProperties',
          'tableCellProperties',
        ],
      },
      translations: [translations, premiumFeaturesTranslations],
      uploadcare: {
        pubkey: UPLOADCARE_PUBKEY,
      },
    };

    configUpdateAlert(this.config);

    this.isLayoutReady = true;
    this.changeDetector.detectChanges();
  }
}

/**
 * This function exists to remind you to update the config needed for premium features.
 * The function can be safely removed. Make sure to also remove call to this function when doing so.
 */
function configUpdateAlert(config: any) {
  if ((configUpdateAlert as any).configUpdateAlertShown) {
    return;
  }

  const isModifiedByUser = (currentValue: string | undefined, forbiddenValue: string) => {
    if (currentValue === forbiddenValue) {
      return false;
    }

    if (currentValue === undefined) {
      return false;
    }

    return true;
  };

  const valuesToUpdate = [];

  (configUpdateAlert as any).configUpdateAlertShown = true;

  if (!isModifiedByUser(config.licenseKey, '<YOUR_LICENSE_KEY>')) {
    valuesToUpdate.push('LICENSE_KEY');
  }

  if (!isModifiedByUser(config.uploadcare?.pubkey, '<YOUR_UPLOADCARE_PUBKEY>')) {
    valuesToUpdate.push('UPLOADCARE_PUBKEY');
  }

  if (valuesToUpdate.length) {
    window.alert(
      [
        'Please update the following values in your editor config',
        'to receive full access to Premium Features:',
        '',
        ...valuesToUpdate.map((value) => ` - ${value}`),
      ].join('\n')
    );
  }
}
