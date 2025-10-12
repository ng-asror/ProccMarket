import { Component, input, Input } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { icons, LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-password-input',
  templateUrl: './password-input.html',
  imports: [LucideAngularModule, ReactiveFormsModule],
})
export class PasswordInputComponent {
  control = input.required<FormControl>();
  placeholder = input.required<string>();

  protected ICONS = icons;
  isVisible = false;

  toggleVisibility() {
    this.isVisible = !this.isVisible;
  }
}
