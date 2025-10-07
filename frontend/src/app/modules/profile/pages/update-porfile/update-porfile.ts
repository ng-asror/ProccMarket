import { Component, inject, OnInit, resource, signal } from '@angular/core';
import { ProfileService } from '../../../../core';
import { firstValueFrom } from 'rxjs';
import { AbstractControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';
import { avatarsMock } from '../../mock/avatars';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-update-porfile',
  imports: [NgFor],
  templateUrl: './update-porfile.html',
  styleUrl: './update-porfile.scss',
})
export class UpdatePorfile implements OnInit {
  private profileService = inject(ProfileService);
  updateForm!: FormGroup;
  protected localAavatars = avatarsMock;
  avatar = signal<string>('avatars/avatar01.svg');

  constructor(private fb: NonNullableFormBuilder) {}
  getProfile = resource({
    loader: () => firstValueFrom(this.profileService.getProfile()),
  });

  ngOnInit(): void {
    const profile = this.getProfile.value();
    if (profile) {
      this.updateForm = this.fb.group(
        {
          name: [
            profile.user.name,
            [Validators.required, Validators.maxLength(60), Validators.minLength(2)],
          ],
          email: [profile.user.email, [Validators.required, Validators.email]],
          description: [profile.user.description, [Validators.maxLength(100)]],
          password: ['', [Validators.required, Validators.maxLength(16), Validators.minLength(8)]],
          password_confirmation: [
            '',
            [Validators.required, Validators.maxLength(16), Validators.minLength(8)],
          ],
        },
        { validators: this.passwordsMatchValidator }
      );
    }
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
    this.avatar.set(selectAvatar);
    const dialog: HTMLDialogElement | null = document.getElementById(
      'avatarsModal'
    ) as HTMLDialogElement;
    dialog?.close();
  }
}
