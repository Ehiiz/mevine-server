// Base API Response Interface
export interface QuidaxApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

// ====== SHARED BASE INTERFACES ======

export interface BaseUser {
  id: string;
  sn: string;
  email: string;
  reference: string | null;
  first_name: string;
  last_name: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface BaseWallet {
  id: string;
  currency: string;
  balance: string;
  locked: string;
  staked?: string;
  converted_balance?: string;
  reference_currency?: string;
  is_crypto?: boolean;
  created_at: string;
  updated_at: string;
  deposit_address?: string;
  destination_tag?: string | null;
}

export interface WalletNetwork {
  id: string;
  name: string;
  deposits_enabled: boolean;
  withdraws_enabled: boolean;
}

export interface FeeRange {
  min: number;
  max: number;
  type: 'flat' | 'percentage';
  value: number;
}

export type CryptoWithdrawalFees =
  | {
      type: 'flat';
      fee: number;
    }
  | {
      type: 'range';
      fee: FeeRange[];
    };

// ====== USER ACCOUNTS ======

export interface CreateSubAccountPayload {
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface EditSubAccountDetailsPayload {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

export interface SubAccount extends BaseUser {
  phone_number: string;
}

// ====== WALLETS & PAYMENT ADDRESSES ======

export interface CreatePaymentAddressPayload {
  currency: string;
  user_id?: string;
}

export interface ReEnqueGeneratedWalletAddressPayload {
  currency: string;
  address_id: string;
}

export interface Wallet extends BaseWallet {
  locked_balance: string;
  name?: string;
  blockchain_enabled?: boolean;
  default_network?: string;
  networks?: WalletNetwork[];
  user?: BaseUser;
}

export interface PaymentAddress {
  id: string;
  reference: string | null;
  currency: string;
  address: string | null;
  network: string;
  user: BaseUser;
  destination_tag: string | null;
  total_payments: number | null;
  created_at: string;
  updated_at: string;
}

// ====== WITHDRAWALS ======

export interface CreateWithdrawalPayload {
  currency: string;
  amount: string;
  fund_uid: string;
  fund_uid2?: string;
  transaction_note: string;
  narration?: string;
  reference?: string;
}

export interface WithdrawalRecipient {
  type: string;
  details?: {
    user_id: string;
  };
}

export interface Withdrawal {
  id: string;
  currency: string;
  amount: string;
  address: string;
  status: string;
  txid?: string;
}

// ====== DEPOSITS ======

export interface PaymentTransaction {
  status: string;
  confirmations: number;
  required_confirmations: number;
}

export interface Deposit {
  id: string;
  currency: string;
  amount: string;
  status: string;
  txid?: string;
  address?: string;
}

// ====== MARKETS ======

export interface Market {
  id: string;
  name: string;
  base_unit: string;
  quote_unit: string;
  min_price: string;
  max_price: string;
  min_amount: string;
}

export interface MarketTicker {
  at: number;
  ticker: {
    buy: string;
    sell: string;
    low: string;
    high: string;
    open: string;
    last: string;
    vol: string;
    avg: string;
  };
}

export interface KLineData {
  time: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

export interface OrderBookItem {
  price: string;
  amount: string;
}

export interface OrderBook {
  asks: OrderBookItem[];
  bids: OrderBookItem[];
}

export interface DepthData {
  asks: [string, string][];
  bids: [string, string][];
}

export interface MarketSummary {
  id: string;
  name: string;
  base_unit: string;
  quote_unit: string;
  last: string;
  vol: string;
}

// ====== TRADES ======

export interface Trade {
  id: number;
  price: string;
  amount: string;
  total: string;
  market: string;
  created_at: number;
  side: 'buy' | 'sell';
}

// ====== SWAPS ======

export interface CreateInstantSwapPayload {
  from_currency: string;
  to_currency: string;
  from_amount?: string;
  to_amount?: string;
  sub_account_id?: string;
}

export interface TemporarySwapQuotationPayload {
  from_currency: string;
  to_currency: string;
  from_amount?: string;
  to_amount?: string;
}

export interface TemporarySwapQuotationResponse {
  from_currency: string;
  to_currency: string;
  from_amount: string;
  to_amount: string;
  quoted_price: string;
  quoted_currency: string;
}

export interface SwapTransaction {
  id: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  to_amount: string;
  status: string;
}

// ====== BENEFICIARIES ======

export interface CreateBeneficiaryAccountPayload {
  name: string;
  currency: string;
  address: string;
  sub_account_id?: string;
}

export interface EditBeneficiaryAccountPayload {
  name?: string;
  currency?: string;
  address?: string;
  sub_account_id?: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  currency: string;
  address: string;
}

// ====== BANK ACCOUNTS ======

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
}

// ====== WEBHOOK EVENTS ======

export interface QuidaxWebhookEvent<T> {
  event: string;
  data: T;
}

// ====== WEBHOOK DATA INTERFACES ======

export interface DepositCompletedData {
  id: string;
  reference: string | null;
  type: string;
  currency: string;
  amount: string;
  fee: string;
  txid: string;
  status: string;
  reason: string | null;
  created_at: string;
  done_at: string | null;
  wallet: Wallet;
  user: BaseUser;
  payment_transaction: PaymentTransaction;
  payment_address: PaymentAddress;
}

export interface WithdrawalCompletedData {
  id: string;
  reference: string | null;
  type: string;
  currency: string;
  amount: string;
  fee: string;
  total: string;
  txid: string;
  transaction_note: string;
  narration: string;
  status: 'Done' | 'pending' | 'failed' | string;
  reason: string | null;
  created_at: string;
  done_at: string | null;
  recipient: WithdrawalRecipient;
  wallet: Wallet;
  user: BaseUser;
}

export interface OrderFilledData {
  id: string;
  market_id: string;
  side: 'buy' | 'sell';
  price: string;
  volume: string;
  status: 'filled' | 'partial_fill';
  user_id?: string;
}

export interface SwapCompletedData {
  id: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  to_amount: string;
  status: 'completed' | 'pending' | 'failed';
  user_id?: string;
}

export interface WalletGeneratedData {
  id: string;
  reference: string | null;
  address: string;
  currency: string;
  network: string;
  user: BaseUser;
  destination_tag: string;
  total_payments: number | null;
  created_at: string;
  updated_at: string;
}

// ====== WEBHOOK EVENT TYPE ALIASES ======

export type DepositWebhookEvent = QuidaxWebhookEvent<DepositCompletedData>;
export type WithdrawalWebhookEvent =
  QuidaxWebhookEvent<WithdrawalCompletedData>;
export type OrderFilledWebhookEvent = QuidaxWebhookEvent<OrderFilledData>;
export type SwapCompletedWebhookEvent = QuidaxWebhookEvent<SwapCompletedData>;
export type WalletGeneratedWebhookEvent =
  QuidaxWebhookEvent<WalletGeneratedData>;
