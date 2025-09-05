import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { icons, LucideAngularModule } from 'lucide-angular';
import { AccordionItem } from '../../components';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-main',
  imports: [RouterLink, LucideAngularModule, AccordionItem, NgForOf],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {
  protected ICONS = icons;

  items = [
    {
      title: 'Статистика и доступность по странам',
      content: 'Актуальная информация о поддерживаемых странах и валютах.',
    },
    {
      title: 'Обновление системы безопасности',
      content: 'Проверяйте новые уровни защиты аккаунта.',
    },
    {
      title: 'Новая версия приложения',
      content: 'Вышла новая версия с улучшенным интерфейсом.',
    },
    {
      title: 'Добавлены способы оплаты',
      content: 'Теперь поддерживаются дополнительные методы платежей.',
    },
  ];
}
