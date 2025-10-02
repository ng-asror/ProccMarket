import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  Renderer2,
} from '@angular/core';

@Component({
  selector: 'app-tradingview-widget',
  templateUrl: './tradingview-widget.html',
  styleUrls: ['./tradingview-widget.scss'],
  host: { ngSkipHydration: 'true' },
})
export class TradingviewWidgetComponent {
  constructor(
    private ngZone: NgZone,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      const script = this.renderer.createElement('script');
      script.src =
        'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
      script.async = true;
      script.innerHTML = `{
      "symbol": "BINANCE:BTCUSDT",
      "chartOnly": false,
      "dateRange": "1D",
      "noTimeScale": false,
      "colorTheme": "light",
      "isTransparent": false,
      "locale": "ru",
      "width": "100%",
      "autosize": true,
      "height": "auto"
    }`;
      this.renderer.appendChild(
        this.el.nativeElement.querySelector('.tradingview-widget-container'),
        script
      );
    });
  }
}
