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
