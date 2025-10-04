import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { icons, LucideAngularModule } from 'lucide-angular';
import { Auth } from '../../../core';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { GoogleButtonComponent } from '../google-button/google-button.component';

@Component({
  selector: 'app-register',
  imports: [LucideAngularModule, ReactiveFormsModule, FormsModule, GoogleButtonComponent],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  private authService = inject(Auth);
  private router = inject(Router);
  protected ICONS = icons;

  passwordToggle = signal(false);
  confirmPasswordToggle = signal(false);
  isLoading = signal(false);
  registerForm!: FormGroup;

  constructor(private fb: NonNullableFormBuilder) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  protected togglePass(input: HTMLInputElement): void {
    if (input.type === 'password') {
      input.type = 'text';
      this.passwordToggle.set(true);
    } else {
      input.type = 'password';
      this.passwordToggle.set(false);
    }
  }

  protected toggleConfirmPass(input: HTMLInputElement): void {
    if (input.type === 'password') {
      input.type = 'text';
      this.confirmPasswordToggle.set(true);
    } else {
      input.type = 'password';
      this.confirmPasswordToggle.set(false);
    }
  }

  async register(): Promise<void> {
    if (this.registerForm.invalid || this.isLoading()) {
      return;
    }

    const telegram_id = "12222";
    const { email, password, confirmPassword } = this.registerForm.getRawValue();
    
    if (password !== confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }

    try {
      this.isLoading.set(true);
      
      // await firstValueFrom storage'ga saqlashni kutadi
      await firstValueFrom(
        this.authService.register(email, telegram_id, password, confirmPassword)
      );
      
      console.log('Registration muvaffaqiyatli, redirect...');
      
      // Navigate
      await this.router.navigate(['/home']);
      
      console.log('Redirect bajarildi');
    } catch (err) {
      console.error('Registration error:', err);
      alert('Регистрация не удалась. Пожалуйста, попробуйте ещё раз.');
    } finally {
      this.isLoading.set(false);
    }
  }
}