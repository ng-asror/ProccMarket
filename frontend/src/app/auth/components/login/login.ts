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
  isLoading = signal(false);

  constructor(private fb: NonNullableFormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
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

  async login(): Promise<void> {
    if (this.loginForm.invalid || this.isLoading()) {
      return;
    }

    try {
      this.isLoading.set(true);
      const { email, password } = this.loginForm.getRawValue();
      
      // await firstValueFrom storage'ga saqlashni kutadi
      await firstValueFrom(this.authService.login(email, password));
      
      console.log('Login muvaffaqiyatli, redirect...');
      
      // NgZone ichida navigate qilish
      await this.router.navigate(['/home']);
      
      console.log('Redirect bajarildi');
    } catch (error) {
      console.error('Login error:', error);
      alert('Kirish muvaffaqiyatsiz. Iltimos, qaytadan urinib ko\'ring.');
    } finally {
      this.isLoading.set(false);
    }
  }
}