import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTheme } from './edit-theme';

describe('EditTheme', () => {
  let component: EditTheme;
  let fixture: ComponentFixture<EditTheme>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTheme]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTheme);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
