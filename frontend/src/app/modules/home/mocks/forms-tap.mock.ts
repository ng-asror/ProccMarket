import { icons, LucideIconData } from 'lucide-angular';
import { TFormsTap } from '../../../core';

export const formsTapMock: {
  type: TFormsTap;
  name: string;
  icon: LucideIconData;
  submenu: string[];
}[] = [
  {
    type: 'proc',
    name: 'Процессинг',
    icon: icons.Activity,
    submenu: [
      'Казино',
      'Букмекерские конторы',
      'Мерчанты',
      'Площадки',
      'Дропы',
      'Трейдеры и команды',
      'Обучение',
    ],
  },
  {
    type: 'countries',
    name: 'По странам',
    icon: icons.MapPin,
    submenu: [
      'Беларусь',
      'Казахстан',
      'Грузия',
      'Армения',
      'Узбекистан',
      'Киргизия',
      'Азейрбайджан',
    ],
  },
  {
    type: 'p2p',
    name: 'P2P',
    icon: icons.UsersRound,
    submenu: [
      'Платформы',
      'Акаунты аренда покупка',
      'Схемы вывода',
      'Обучение',
    ],
  },
  {
    type: 'arb',
    name: 'Арбитраж',
    icon: icons.Scale,
    submenu: ['Обучение'],
  },
  {
    type: 'exch',
    name: 'Обменник',
    icon: icons.BadgeDollarSign,
    submenu: ['Надежные', 'Курсы кейсы', 'Общение'],
  },
  {
    type: 'legal',
    name: 'Юредический отдел',
    icon: icons.Gavel,
    submenu: [
      'Блокировка банков',
      'Банки СФР ФНС',
      'Шаблоны заявлений',
      'Консультации',
    ],
  },
  {
    type: 'bl',
    name: 'Чёрный список',
    icon: icons.Ban,
    submenu: ['Кидалы'],
  },
  {
    type: 'priv',
    name: 'Приват',
    icon: icons.Lock,
    submenu: [],
  },
  {
    type: 'train',
    name: 'Обучение',
    icon: icons.GraduationCap,
    submenu: ['Гайды', 'Статьи', 'Курсы', 'Сливы'],
  },
  {
    type: 'blog',
    name: 'Блог',
    icon: icons.Newspaper,
    submenu: [],
  },
];
