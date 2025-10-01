import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradingviewWidget } from './tradingview-widget';

describe('TradingviewWidget', () => {
  let component: TradingviewWidget;
  let fixture: ComponentFixture<TradingviewWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradingviewWidget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradingviewWidget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
