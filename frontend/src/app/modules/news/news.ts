import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-news',
  imports: [RouterOutlet],
  templateUrl: './news.html',
  styleUrl: './news.scss',
})
export class News {}
