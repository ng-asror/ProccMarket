import { Component, inject, OnInit, signal } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import {
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Auth } from '../../../core';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { GoogleButtonComponent } from '../google-button/google-button.component';

@Component({
  selector: 'app-login',
  imports: [LucideAngularModule, ReactiveFormsModule, FormsModule, GoogleButtonComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private authService = inject(Auth);
  protected ICONS = icons;
  passwordToggle = signal(false);
  loginForm!: FormGroup;
  constructor(private fb: NonNullableFormBuilder, private router: Router) {}
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }
  protected showPass(input: HTMLInputElement): void {
    if (input.type === 'password') {
      this.passwordToggle.set(true);
    } else {
      this.passwordToggle.set(false);
    }
  }

  async login(): Promise<void> {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.getRawValue();
      await firstValueFrom(this.authService.login(email, password)).then(() => {
        this.router.navigate(['/home']);
      });
    }
  }
}
