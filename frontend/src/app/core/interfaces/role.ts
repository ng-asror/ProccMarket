export interface IRole {
  id: number;
  name: string;
  min_deposit: string;
  created_at: Date;
  updated_at: Date;
  users_count: number;
}
