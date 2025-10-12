import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiptapEditor } from './tiptap-editor';

describe('TiptapEditor', () => {
  let component: TiptapEditor;
  let fixture: ComponentFixture<TiptapEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiptapEditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TiptapEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
