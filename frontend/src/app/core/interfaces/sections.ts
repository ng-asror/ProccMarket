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
