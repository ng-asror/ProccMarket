import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ckeditor } from './ckeditor';

describe('Ckeditor', () => {
  let component: Ckeditor;
  let fixture: ComponentFixture<Ckeditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ckeditor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ckeditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
