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
    avatar_url: string;
    role: IRole;
  };
  analytics: {
    topics_count: number;
    views_count: number;
    likes_count: number;
  };
}
