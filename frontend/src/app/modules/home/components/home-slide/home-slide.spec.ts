import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeSlide } from './home-slide';

describe('HomeSlide', () => {
  let component: HomeSlide;
  let fixture: ComponentFixture<HomeSlide>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeSlide]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeSlide);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
