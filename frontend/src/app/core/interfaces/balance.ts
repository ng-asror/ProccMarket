import { ResultData } from './result-data';

export interface ICreateInvoiceRes extends ResultData {
  data: {
    invoice: {
      invoice_id: number;
      hash: string;
      currency_type: string;
      asset: string;
      amount: string;
      pay_url: string;
      bot_invoice_url: string;
      mini_app_invoice_url: string;
      web_app_invoice_url: string;
      status: string;
      created_at: string;
      allow_comments: boolean;
      allow_anonymous: boolean;
    };
  };
}
