import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePorfile } from './update-porfile';

describe('UpdatePorfile', () => {
  let component: UpdatePorfile;
  let fixture: ComponentFixture<UpdatePorfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePorfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePorfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
