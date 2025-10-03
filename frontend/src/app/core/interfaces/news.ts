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
  image: string;
  user_id: number;
  category_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  comments_count: number;
  likes_count: number;
  views_count: number;
  shares_count: number;
  image_url: string;
  category: { id: number; name: string };
  comments: {
    id: number;
    replay_id: string;
    news_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user: {
      id: number;
      name: string;
      role_name: string;
      role: string;
    };
  }[];
}
