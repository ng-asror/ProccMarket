import { icons, LucideIconData } from 'lucide-angular';
import { TFormsTap } from '../../../core';

export const formsTapMock: {
  type: TFormsTap;
  name: string;
  icon: LucideIconData;
}[] = [
  {
    type: 'proc',
    name: 'Процессинг',
    icon: icons.Activity,
  },
  {
    type: 'p2p',
    name: 'P2P',
    icon: icons.UsersRound,
  },
  {
    type: 'arb',
    name: 'Арбитраж',
    icon: icons.Scale,
  },
  {
    type: 'exch',
    name: 'Обменник',
    icon: icons.BadgeDollarSign,
  },
  { type: 'legal', name: 'Юредический отдел', icon: icons.Gavel },
  { type: 'bl', name: 'Чёрный список', icon: icons.Ban },
  { type: 'priv', name: 'Приват', icon: icons.Lock },
  { type: 'train', name: 'Обучение', icon: icons.GraduationCap },
  {
    type: 'blog',
    name: 'Блог',
    icon: icons.Newspaper,
  },
];
