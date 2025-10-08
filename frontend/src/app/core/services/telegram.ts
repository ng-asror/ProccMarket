import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ITgUser } from '../interfaces';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

interface TgButton {
  show(): void;
  hide(): void;
  onClick(fn: Function): void;
  offClick(fn: Function): void;
}
@Injectable({
  providedIn: 'root',
})
export class Telegram {
  private tg: any;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private router: Router) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.tg = (window as any).Telegram?.WebApp;
      this.tg?.ready(); // Telegram WebApp faollashadi
    }
  }

  async getTgUser(): Promise<ITgUser | null> {
    if (!this.isBrowser || !this.tg) return null;
    return this.tg.initDataUnsafe;
  }

  async getUserLocalId(): Promise<string | null> {
    return await this.getCloudStorage('tg_id');
  }

  get BackButton(): TgButton {
    return this.tg.BackButton;
  }

  init(headerColor: string): void {
    if (!this.isBrowser || !this.tg) return;
    this.tg.ready();
    this.tg.setHeaderColor(headerColor);
    this.tg.expand();
    // this.tg.enableClosingConfirmation();
  }

  hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void {
    if (!this.isBrowser || !this.tg?.HapticFeedback) return;
    this.tg.HapticFeedback.impactOccurred(type);
  }

  async setCloudItem(key: string, value: string): Promise<void> {
    if (!this.isBrowser || !this.tg?.CloudStorage) return;
    return new Promise((resolve, reject) => {
      this.tg.CloudStorage.setItem(key, value, (error: any, success: boolean) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  async getCloudStorage(key: string): Promise<string | null> {
    if (!this.isBrowser || !this.tg?.CloudStorage) return null;
    return new Promise((resolve, reject) => {
      this.tg.CloudStorage.getItem(key, (error: any, value: string) => {
        if (error) reject(error);
        else resolve(value);
      });
    });
  }

  async removeCloudItem(key: string): Promise<void> {
    if (!this.isBrowser || !this.tg?.CloudStorage) return;
    return new Promise((resolve, reject) => {
      this.tg.CloudStorage.removeItem(key, (error: any, success: boolean) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }

  showAlert(message: string): void {
    if (!this.isBrowser || !this.tg) return;
    this.tg.showAlert(message);
  }

  // back button events
  showBackButton(url: string): void {
    if (!this.BackButton) {
      return;
    }
    this.BackButton.show();
    this.BackButton.onClick(() => this.router.navigateByUrl(url));
  }
  hiddeBackButton(url: string): void {
    if (!this.BackButton) {
      return;
    }

    this.BackButton.offClick(() => this.router.navigateByUrl(url));
    this.BackButton.hide();
  }
}
