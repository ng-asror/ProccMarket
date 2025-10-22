import { Result } from './result';

export interface ITopicRes extends Result {
  topic: {
    id: number;
    title: string;
    content: string;
    image: string;
    image_url: string;
    closed: boolean;
    created_at: Date;
    updated_at: Date;
    author: {
      id: number;
      telegram_id: string;
      email: string;
      role_id: number;
      balance: string;
      name: string | null;
      avatar: string | null;
      cover: string | null;
      cover_url: string | null;
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
        created_at: string;
        updated_at: string;
        users_count: number;
      };
    };
    section: {
      id: number;
      parent_id: number;
      position: number;
      name: string;
      description: any;
      access_price: string;
      default_roles: any;
      image: any;
      created_at: string;
      updated_at: string;
      image_url: any;
      default_roles_json: any[];
      parent: {
        id: number;
        parent_id: any;
        position: number;
        name: string;
        description: any;
        access_price: string;
        default_roles: any;
        image: any;
        created_at: string;
        updated_at: string;
        image_url: any;
        default_roles_json: any[];
      };
    };
    posts_count: number;
    likes_count: number;
    dislikes_count: number;
    shares_count: number;
    views_count: number;
    user_reaction: any;
    user_shared: boolean;
  };
}

export interface ITopicLikeDislikRes extends Result {
  data: {
    action: string;
    likes_count: number;
    dislikes_count: number;
    user_reaction: 'like' | 'dislike';
  };
}
