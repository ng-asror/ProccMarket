export interface ITgUser {
  user: User;
  chat_instance: string;
  chat_type: string;
  auth_date: string;
  signature: string;
  hash: string;
  start_param: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  language_code: string;
  allows_write_to_pm: boolean;
  photo_url: string;
}

export interface IUserInfoChat {
  data: {
    id: number;
    telegram_id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    avatar_url: string | null;
    balance: string;
    description: string;
    is_admin: boolean;
    role_name: string | null;
    created_at: string;
    updated_at: string;
  };
}
