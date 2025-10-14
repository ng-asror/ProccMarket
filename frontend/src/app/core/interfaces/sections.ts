import { Result } from './result';

export interface ISectionsRes extends Result {
  sections: {
    id: number;
    parent_id: any;
    position: number;
    name: string;
    description: any;
    access_price: string;
    default_roles?: string[];
    image?: string;
    created_at: string;
    updated_at: string;
    topics_count: number;
    has_access: boolean;
    is_purchased: boolean;
    posts_count: number;
    image_url?: string;
    children?: {
      id: number;
      parent_id: number;
      position: number;
      name: string;
      description: any;
      access_price: string;
      default_roles?: string[];
      image: any;
      created_at: string;
      updated_at: string;
      topics_count: number;
      has_access: boolean;
      is_purchased: boolean;
      posts_count: number;
      image_url: any;
    }[];
  }[];
}

export interface ISectionsDashboardRes extends Result {
  sections: ISectionsDashboard[];
}

export interface ISectionsDashboard {
  id: number;
  name: string;
  description: any;
  image_url?: string;
  access_price: string;
  topics_count: number;
  has_access: boolean;
  is_purchased: boolean;
  parent_id?: number | null;
  parent?: ISectionsDashSecParent;
  position: number;
  topics: ITopic[];
}

export interface ISectionsDashSecParent {
  id: number;
  parent_id: any;
  position: number;
  name: string;
  description: string;
  access_price: string;
  default_roles: string[];
  image: string;
  created_at: Date;
  updated_at: Date;
  image_url: string;
}

export interface ITopic {
  id: number;
  title: string;
  image: string;
  image_url: string;
  closed: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: number;
    telegram_id: string;
    email: string;
    referral_code: string;
    referred_by: any;
    role_id: number;
    balance: string;
    name: string | null;
    avatar: string;
    description: string;
    banned: boolean;
    last_deposit_at: string;
    is_admin: boolean;
    email_verified_at: any;
    created_at: string;
    updated_at: string;
    deleted_at: any;
    role_name: string | null;
    avatar_url: string;
    role: {
      id: number;
      name: string;
      min_deposit: string;
      created_at: Date;
      updated_at: Date;
      users_count: number;
    };
  };
  posts_count: number;
  likes_count: number;
  dislikes_count: number;
  shares_count: number;
  views_count: number;
  user_reaction: any;
  user_shared: boolean;
}
