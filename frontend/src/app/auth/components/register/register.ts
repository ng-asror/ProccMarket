import { Component, OnInit, AfterViewInit, inject, signal } from '@angular/core';
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
    this.passwordToggle.set(input.type === 'password');
  }

  protected toggleConfirmPass(input: HTMLInputElement): void {
    this.confirmPasswordToggle.set(input.type === 'password');
  }

  async register(): Promise<void> {
    if (this.registerForm.invalid) return;
    const telegram_id = "12222";
    

    const { email, password, confirmPassword } = this.registerForm.getRawValue();
    if (password !== confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }

    try {
      await firstValueFrom(this.authService.register(email, telegram_id, password, confirmPassword));
      this.router.navigate(['/home']);
    } catch (err) {
      console.error('Registration error:', err);
    }
  }
}
