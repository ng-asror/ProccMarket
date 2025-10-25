import { Component, inject, input, OnInit, resource } from '@angular/core';
import { icons, LucideAngularModule } from 'lucide-angular';
import { MessageService, Order, SocketService } from '../../../../core';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-header',
  imports: [LucideAngularModule, ReactiveFormsModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit {
  private messagesService = inject(MessageService);
  private socketService = inject(SocketService);
  private orderService = inject(Order);
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  orderForm: FormGroup;

  IDS = input.required<{ user_id: number; chat_id: number }>({ alias: 'all-id' });

  protected ICONS = icons;
  constructor() {
    this.orderForm = this.fb.group({
      conversation_id: [, Validators.required],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.maxLength(500)],
      amount: [, [Validators.required, Validators.min(20)]],
      deadline: ['', Validators.required],
      is_client_order: ['true'],
    });
  }

  userInfo = resource({
    loader: async () => {
      const res = await firstValueFrom(this.messagesService.userInfo(this.IDS().user_id));
      return res.data;
    },
  });

  orderView = resource({
    loader: () => firstValueFrom(this.orderService.order_list(this.IDS().chat_id)),
  });

  ngOnInit(): void {
    this.orderForm.patchValue({ conversation_id: this.IDS().chat_id });
    this.socketService.listen('order.created').subscribe((data) => {
      console.log(data);
    });
  }

  protected deleteChat(): void {
    firstValueFrom(this.messagesService.deleteConversation(this.IDS().chat_id)).then(() => {
      this.socketService.emit('conversation.delete', { conversation_id: this.IDS().chat_id });
      this.router.navigate(['/inbox/messages']);
    });
  }

  createOrder(): void {
    if (this.orderForm.valid) {
      const req = this.orderForm.getRawValue();
      firstValueFrom(
        this.orderService.create_order({ ...req, is_client_order: JSON.parse(req.is_client_order) })
      ).then(() => {
        this.socketService.emit('order.created', { conversation_id: this.IDS().chat_id });
      });
    }
  }
}
