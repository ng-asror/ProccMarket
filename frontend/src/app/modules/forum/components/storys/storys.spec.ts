import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Storys } from './storys';

describe('Storys', () => {
  let component: Storys;
  let fixture: ComponentFixture<Storys>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Storys]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Storys);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
