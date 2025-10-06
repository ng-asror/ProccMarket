import { Result } from './result';
import { ResultData } from './result-data';

export interface INewsRes {
  success: boolean;
  data: INewBlog[];
}

export interface INewBlog {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  news_count: number;
  news: INews[];
}

export interface INews {
  id: number;
  title: string;
  image?: string;
  user_id: number;
  category_id: number;
  api_url: string;
  image_url?: string;
}

export interface INewsInfoRes extends ResultData {
  data: INewsInfo;
}

export interface INewsInfo {
  id: number;
  title: string;
  description: string;
  image: any;
  image_url: any;
  status: string;
  created_at: Date;
  updated_at: Date;
  author: IAuthorNewsInfo;
  likes_count: number;
  dislikes_count: number;
  views_count: number;
  shares_count: number;
  comments_count: number;
  user_reaction: any;
  user_shared: boolean;
  category: { id: number; name: string };
}

export interface INewsCommentsRes extends Result {
  data: IDaum[];
}

export interface IDaum {
  id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user: ICommentUser;
  likes_count: number;
  shares_count: number;
  replies_count: number;
  user_reaction: any;
}
export interface ICommentUser {
  id: number;
  telegram_id: string;
  email: string;
  role_id: any;
  balance: string;
  name: string;
  avatar: any;
  banned: boolean;
  last_deposit_at: string;
  is_admin: number;
  email_verified_at: any;
  remember_token: any;
  created_at: string;
  updated_at: string;
  deleted_at: any;
  role_name: any;
  role: any;
}

export interface IAuthorNewsInfo {
  id: number;
  telegram_id: any;
  email: string;
  role_id: any;
  balance: string;
  name: string;
  avatar: any;
  banned: boolean;
  last_deposit_at: any;
  is_admin: boolean;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: any;
  role_name: any;
  image_url: any;
  role: any;
}
