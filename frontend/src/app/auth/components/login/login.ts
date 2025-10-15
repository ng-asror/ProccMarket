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
import { Auth, Telegram } from '../../../core';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { PasswordInputComponent } from '../../../components';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [LucideAngularModule, ReactiveFormsModule, FormsModule, PasswordInputComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  private authService = inject(Auth);
  private telegram = inject(Telegram);

  passwordToggle = signal(false);
  protected ICONS = icons;
  loginForm!: FormGroup;
  isLoading = signal<boolean>(false);
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
    if (this.loginForm.invalid || this.isLoading()) return;
    try {
      this.isLoading.set(true);
      const { email, password } = this.loginForm.getRawValue();
      await firstValueFrom(this.authService.login(email, password));
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          this.telegram.showAlert('Пользователь не зарегистрирован');
        }
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
