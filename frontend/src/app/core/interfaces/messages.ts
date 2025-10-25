import { IUser } from './auth';
import { ResultData } from './result-data';

export interface IConversationsRes {
  data: IConversations[];
}

export interface IConversationRes {
  conversation: IConversations[];
  messages: IMessage[];
  pagination: IPagination;
}
export interface IMessageRes extends ResultData {
  data: IMessage;
}

export interface IMessage {
  id: number;
  conversation_id: number;
  user_id: number;
  user: IUser;
  content: string;
  file_path: any;
  file_name: any;
  file_type: any;
  file_size: any;
  file_url: any;
  reply_to_message_id: any;
  reply_to: any;
  read_at: any;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}
interface IPagination {}
export interface IConversations {
  id: number;
  other_participant: IOtherParticipant;
  last_message: ILastMessage | null;
  unread_count: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface IOtherParticipant {
  id: number;
  telegram_id?: string;
  name?: string | null;
  email: string;
  avatar: string | null;
  avatar_url: string | null;
  balance: string;
  description: any;
  is_admin: boolean;
  role_name: any;
  created_at: string;
  updated_at: string;
}

export interface ILastMessage {
  id: number;
  conversation_id: number;
  user_id: number;
  user: IUser;
  content: string;
  file_path: any;
  file_name: any;
  file_type: any;
  file_size: any;
  file_url: any;
  reply_to_message_id: any;
  read_at: any;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ICreateConversationRes extends ResultData {
  data: {
    id: number;
    other_participant: IOtherParticipant;
    last_message: any;
    last_message_at: any;
    unread_count: number;
    created_at: string;
    updated_at: string;
  };
}
