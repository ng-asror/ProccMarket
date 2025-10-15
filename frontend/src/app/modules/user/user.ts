import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';
import { FormCard } from '../../components';

@Component({
  selector: 'app-user',
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './user.html',
  styleUrl: './user.scss',
})
export class User {
  protected ICONS = icons;
}
