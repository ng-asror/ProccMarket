import { Component } from '@angular/core';
import { Navbar } from './components';
import { Menubar } from './components/menubar/menubar';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-layout',
  imports: [Navbar, Menubar, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {}
