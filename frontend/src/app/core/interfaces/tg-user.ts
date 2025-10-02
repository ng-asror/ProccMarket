export interface ITgUser {
  user: User;
  chat_instance: string;
  chat_type: string;
  auth_date: string;
  signature: string;
  hash: string;
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
