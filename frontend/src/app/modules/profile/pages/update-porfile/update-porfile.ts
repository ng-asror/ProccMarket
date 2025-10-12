import { Component, inject, OnDestroy, OnInit, resource, signal } from '@angular/core';
import { ProfileService, Telegram } from '../../../../core';
import { firstValueFrom } from 'rxjs';
import {
  AbstractControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { avatarsMock } from '../../mock/avatars';
import { environment } from '../../../../../environments/environment.development';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

interface IUpdateForm {
  name: string;
  avatar: string;
  email: string;
  description: string;
  password?: string;
  password_confirmation?: string;
}

@Component({
  selector: 'app-update-porfile',
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './update-porfile.html',
  styleUrl: './update-porfile.scss',
})
export class UpdatePorfile implements OnInit, OnDestroy {
  protected apiurl = environment.ngrok;
  private telegram = inject(Telegram);
  private profileService = inject(ProfileService);
  private fb = inject(NonNullableFormBuilder);
  private router = inject(Router);
  updateForm!: FormGroup;
  loader = signal<boolean>(true);
  protected localAavatars = avatarsMock;
  userAvatar = signal<string>('https://proccmarket.com/avatars/avatar10.svg');
  constructor() {
    this.updateForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(60), Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        description: ['', [Validators.maxLength(100)]],
        password: ['', [Validators.maxLength(16), Validators.minLength(8)]],
        password_confirmation: ['', [Validators.maxLength(16), Validators.minLength(8)]],
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  async ngOnInit(): Promise<void> {
    this.telegram.showBackButton('/profile');
    await firstValueFrom(this.profileService.getProfile())
      .then((res) => {
        this.userAvatar.set(
          res.user.avatar_url ? res.user.avatar_url : 'https://proccmarket.com/avatars/avatar10.svg'
        );
        this.updateForm.patchValue({
          name: res.user.name,
          email: res.user.email,
          description: res.user.description,
        });
      })
      .finally(() => {
        this.loader.set(false);
      });
  }

  // Custom validator
  passwordsMatchValidator(control: AbstractControl) {
    const password = control.get('password')?.value;
    const confirm = control.get('password_confirmation')?.value;
    if (password && confirm && password !== confirm) {
      control.get('password_confirmation')?.setErrors({ mismatch: true });
    } else {
      control.get('password_confirmation')?.setErrors(null);
    }
    return null;
  }
  protected selectAvatar(selectAvatar: string): void {
    this.userAvatar.set(selectAvatar);
    const dialog: HTMLDialogElement | null = document.getElementById(
      'avatarsModal'
    ) as HTMLDialogElement;
    dialog?.close();
  }

  async update(): Promise<void> {
    const body: IUpdateForm = this.updateForm.getRawValue();
    if (body.password === '' && body.password_confirmation === '') {
      delete body.password;
      delete body.password_confirmation;
    }
    firstValueFrom(this.profileService.updateProfile({ ...body, avatar: this.userAvatar() })).then(
      () => {
        this.router.navigate(['/profile']);
      }
    );
  }

  ngOnDestroy(): void {
    this.telegram.hiddeBackButton('/profile');
  }
}
