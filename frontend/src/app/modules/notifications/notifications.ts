import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-notifications',
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  templateUrl: './notifications.html',
  styleUrl: './notifications.scss',
})
export class Notifications {}
