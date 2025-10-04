// src/app/core/google-identity.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private initialized = false;
  private clientId?: string;
  private credentialSubject = new Subject<any>();
  credential$ = this.credentialSubject.asObservable();

  // Expose a ready() so components can await SDK availability
  async ready(timeout = 5000): Promise<void> {
    if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
      return;
    }
    const start = Date.now();
    return new Promise<void>((resolve, reject) => {
      const interval = setInterval(() => {
        if ((window as any).google && (window as any).google.accounts && (window as any).google.accounts.id) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          reject(new Error('Google Identity SDK not loaded within timeout'));
        }
      }, 50);
    });
  }

  // Initialize (call once)
  async init(clientId: string): Promise<void> {
    await this.ready();
    if (this.initialized) {
      // Already initialized, ignore
      return;
    }
    this.clientId = clientId;
    (window as any).google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        // Emit to subscribers (Login/Register will subscribe)
        this.credentialSubject.next(response);
      },
    });
    this.initialized = true;
  }

  // Render button into a container element
  async renderButton(container: HTMLElement, options?: any): Promise<void> {
    await this.ready();
    if (!this.initialized) {
      throw new Error('GoogleIdentityService: init(clientId) must be called before renderButton');
    }
    // ensure clean container
    container.innerHTML = '';
    (window as any).google.accounts.id.renderButton(container, options ?? {
      theme: 'outline',
      size: 'large',
      width: '100%',
    });
  }

  // Optional: trigger One Tap prompt
  prompt(): void {
    if (this.initialized) {
      (window as any).google.accounts.id.prompt();
    }
  }
}
