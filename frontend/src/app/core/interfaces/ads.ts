import { ResultData } from './result-data';

export interface IAdsRes extends ResultData {
  banners: {
    id: number;
    title: string;
    description: string | null;
    image_url: string;
    link: string;
  }[];
}
