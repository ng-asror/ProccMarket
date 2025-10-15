import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { icons, LucideAngularModule } from 'lucide-angular';
import { Auth, Telegram } from '../../../core';
import { firstValueFrom } from 'rxjs';
import { PasswordInputComponent } from '../../../components';

@Component({
  selector: 'app-register',
  imports: [LucideAngularModule, ReactiveFormsModule, FormsModule, PasswordInputComponent],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  private authService = inject(Auth);
  private telegram = inject(Telegram);
  private fb = inject(NonNullableFormBuilder);
  protected ICONS = icons;

  passwordToggle = signal(false);
  confirmPasswordToggle = signal(false);
  isLoading = signal(false);
  registerForm: FormGroup;

  constructor() {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(16)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordsMatchValidator }
    );
  }
  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')!.value;
    const confirmPassword = control.get('confirmPassword')!.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  get passwordControl(): FormControl {
    return this.registerForm.get('password') as FormControl;
  }

  get repeatPasswordControl(): FormControl {
    return this.registerForm.get('confirmPassword') as FormControl;
  }

  ngOnInit(): void {}

  async register(): Promise<void> {
    if (this.registerForm.invalid || this.isLoading()) {
      return;
    }
    const tgUser = await this.telegram.getTgUser();
    if (!tgUser) return;
    const tg_id = tgUser.user.id;
    const { email, password, confirmPassword } = this.registerForm.getRawValue();

    if (password !== confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }
    try {
      this.isLoading.set(true);
      await firstValueFrom(
        this.authService.register(email, tg_id.toString(), password, confirmPassword)
      );
    } catch (err) {
      console.error('Registration error:', err);
      alert('Регистрация не удалась. Пожалуйста, попробуйте ещё раз.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
