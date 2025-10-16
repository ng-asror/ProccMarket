import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {}
