import { z } from 'zod';

// Schema for section data validation
export const sectionSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  access_price: z.number(),
  default_roles: z.array(z.number()).nullable(),
  image: z.string().nullable(),
  image_url: z.string().nullable(),
  parent_id: z.number().nullable(),
  position: z.number(),
  topics_count: z.number().optional(),
  users_count: z.number().optional(),
  children: z.lazy(() => z.array(sectionSchema)).optional(),
  parent: z.lazy(() => sectionSchema.nullable()).optional(),
});

export type Section = z.infer<typeof sectionSchema>;

// Role type for dropdown
export type Role = {
  id: number;
  name: string;
  users_count?: number;
};

// Types for drag and drop
export type DragItem = {
  id: number;
  type: 'section';
  section: Section;
};

export type DropResult = {
  targetId: number | null;
  position: number;
};