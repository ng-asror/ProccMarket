import {
  AfterViewInit,
  Component,
  ElementRef,
  Renderer2,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-tradingview-widget',
  templateUrl: './tradingview-widget.html',
  styleUrls: ['./tradingview-widget.scss'],
})
export class TradingviewWidgetComponent implements AfterViewInit {
  @ViewChild('container', { static: true }) container!: ElementRef;

  constructor(private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    const script = this.renderer.createElement('script');
    script.type = 'text/javascript';
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;

    script.innerHTML = JSON.stringify({
      symbol: 'BINANCE:BTCUSDT',
      chartOnly: false,
      dateRange: '1D',
      noTimeScale: false,
      colorTheme: 'light',
      isTransparent: false,
      locale: 'ru',
      width: '100%',
      autosize: true,
      height: '100%',
    });

    this.renderer.appendChild(this.container.nativeElement, script);
  }
}
