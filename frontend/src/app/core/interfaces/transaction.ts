import { ResultData } from './result-data';

export interface ITransactionRes extends ResultData {
  data: { transactions: ITransaction[]; pagination: pagination };
}

export interface ITransaction {
  id: number;
  user_id: number;
  type: string;
  amount: string;
  status: string;
  transaction_id: any;
  payable_type: any;
  payable_id: any;
  paid_at: any;
  description: string;
  created_at: string;
  updated_at: string;
}

interface pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}
