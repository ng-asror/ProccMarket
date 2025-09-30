import { TestBed } from '@angular/core/testing';

import { BtcWs } from './btc-ws';

describe('BtcWs', () => {
  let service: BtcWs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BtcWs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
