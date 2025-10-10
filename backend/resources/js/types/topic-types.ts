import { z } from 'zod';

export const topicSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  image: z.string().nullable(),
  image_url: z.string().nullable(),
  closed: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  user: z.object({
    id: z.number(),
    name: z.string(),
    avatar: z.string().nullable(),
  }),
  section: z.object({
    id: z.number(),
    name: z.string(),
  }),
  posts_count: z.number().optional(),
  views_count: z.number().optional(),
  likes_count: z.number().optional(),
  dislikes_count: z.number().optional(),
  shares_count: z.number().optional(),
});

export type Section = {
  id: number;
  name: string;
};

export type User = {
  id: number;
  name: string;
  avatar: string | null;
  email: string | null;
  telegram_id: string | null;
};