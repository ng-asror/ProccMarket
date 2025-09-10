import { Component } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-all',
  imports: [LucideAngularModule],
  templateUrl: './all.html',
  styleUrl: './all.scss',
})
export class All {
  protected ICONS = icons;
  audio: HTMLAudioElement;
  constructor() {
    this.audio = new Audio();
    this.audio.src = '/sounds/notification-sound.mp3';
    this.audio.load();
  }

  playSound() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.play();
  }
}
