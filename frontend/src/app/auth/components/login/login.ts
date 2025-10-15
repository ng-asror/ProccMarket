import { Component, inject, OnInit, signal } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import {
  FormControl,
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Auth } from '../../../core';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { PasswordInputComponent } from '../../../components';

@Component({
  selector: 'app-login',
  imports: [LucideAngularModule, ReactiveFormsModule, FormsModule, PasswordInputComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private authService = inject(Auth);

  passwordToggle = signal(false);
  protected ICONS = icons;
  loginForm!: FormGroup;

  constructor(private fb: NonNullableFormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(16)]],
    });
  }

  protected showPass(input: HTMLInputElement): void {
    if (input.type === 'password') {
      input.type = 'text';
      this.passwordToggle.set(true);
    } else {
      input.type = 'password';
      this.passwordToggle.set(false);
    }
  }
  get passwordControl(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }
  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }
    try {
      const { email, password } = this.loginForm.getRawValue();
      await firstValueFrom(this.authService.login(email, password));
    } catch (error) {
      console.error('Login error:', error);
    }
  }
}
