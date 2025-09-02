import { icons, LucideIconData } from 'lucide-angular';
import { TFormsTap } from '../../../core';

export const formsTapMock: {
  type: TFormsTap;
  name: string;
  icons: LucideIconData;
}[] = [
  {
    type: 'proc',
    name: 'Процессинг',
    icons: icons.Activity,
  },
  {
    type: 'p2p',
    name: 'P2P',
    icons: icons.UsersRound,
  },
  {
    type: 'arb',
    name: 'Арбитраж',
    icons: icons.Scale,
  },
  {
    type: 'exch',
    name: 'Обменник',
    icons: icons.BadgeDollarSign,
  },
  { type: 'legal', name: 'Юредический отдел', icons: icons.Gavel },
  { type: 'bl', name: 'Чёрный список', icons: icons.Ban },
  { type: 'priv', name: 'Приват', icons: icons.Lock },
  { type: 'train', name: 'Обучение', icons: icons.GraduationCap },
];
