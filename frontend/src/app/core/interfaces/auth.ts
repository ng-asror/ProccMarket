import { Result } from './result';

export interface ILoginRes extends Result {
  user: IUser;
  token: string;
}

export interface IUser {
  id: number;
  telegram_id: string;
  email: string;
  role_id: any;
  balance: string;
  name: any;
  avatar: any;
  banned: boolean;
  last_deposit_at: any;
  is_admin: number;
  email_verified_at: any;
  remember_token: any;
  created_at: string;
  updated_at: string;
  deleted_at: any;
  role_name: any;
  role: any;
}
