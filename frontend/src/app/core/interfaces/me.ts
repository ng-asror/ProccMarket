import { ResultData } from './result-data';

export interface IGetMeRes extends ResultData {
  user: {
    id: number;
    telegram_id: string;
    email: string;
    role_id: string;
    balance: string;
    name: string;
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
  };
}
