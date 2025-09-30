import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';
import { formsTapMock } from '../../../modules/home/mocks';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, LucideAngularModule, NgFor, NgIf],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  protected items = formsTapMock;
}
