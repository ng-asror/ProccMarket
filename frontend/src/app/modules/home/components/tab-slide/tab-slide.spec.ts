import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabSlide } from './tab-slide';

describe('TabSlide', () => {
  let component: TabSlide;
  let fixture: ComponentFixture<TabSlide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabSlide]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabSlide);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
