import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabContent } from './tab-content';

describe('TabContent', () => {
  let component: TabContent;
  let fixture: ComponentFixture<TabContent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabContent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabContent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
