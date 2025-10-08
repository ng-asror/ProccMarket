import { IUser } from './auth';
import { ResultData } from './result-data';
import { IRole } from './role';

export interface IProfileRes extends ResultData {
  user: {
    id: number;
    telegram_id: string;
    email: string;
    role_id: number;
    balance: string;
    name: string;
    avatar: string;
    description: string;
    banned: boolean;
    last_deposit_at: string;
    is_admin: boolean;
    email_verified_at: any;
    created_at: Date;
    updated_at: Date;
    deleted_at: any;
    role_name: string;
    avatar_url: string | null;
    role: IRole;
  };
  analytics: {
    topics_count: number;
    views_count: number;
    likes_count: number;
  };
}

export interface IMyTopics extends ResultData {
  user: IUser;
  topics: IMyTopicsItem[];
}

export interface IMyTopicsItem {
  id: number;
  title: string;
  image: any;
  image_url: any;
  closed: boolean;
  created_at: string;
  updated_at: string;
  section: IMyTopicsSection;
  posts_count: number;
  likes_count: number;
  dislikes_count: number;
  shares_count: number;
  views_count: number;
  user_reaction: string;
  user_shared: boolean;
}

export interface IMyTopicsSection {
  id: number;
  name: string;
  description: any;
  image_url: any;
  access_price: string;
  position: number;
  parent_id: number;
}
