import { N } from '@faker-js/faker/dist/airline-BUL6NtOJ';

export interface QuidaxApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

// --- User Accounts Interfaces ---
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

export interface SubAccount {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;

  sn: string;

  reference: null | string;

  display_name: string | null;
  created_at: string;
  updated_at: string;
  // Add other relevant fields as per Quidax documentation
}

// --- Wallets Interfaces ---
export interface CreatePaymentAddressPayload {
  currency: string;
  user_id?: string; // Optional if using master account
}

export interface ReEnqueGeneratedWalletAddressPayload {
  currency: string;
  address_id: string; // Assuming an address ID is needed to re-enqueue
  // Add other necessary fields if any
}

export interface Wallet {
  id: string;
  currency: string;
  balance: string;
  locked_balance: string;
  // Add other relevant fields
}

export interface WalletGeneratedUser {
  id?: string;
  sn?: string;
  email?: string;
  reference?: string | null;
  first_name?: string;
  last_name?: string;
  display_name?: string | null;
  created_at?: string; // ISO 8601 date string
  updated_at?: string; // ISO 8601 date string
}

/**
 * Interface for the 'data' payload of a 'wallet.address.generated' webhook event.
 * All properties are optional.
 */
export interface PaymentAddress {
  id?: string;
  reference?: string | null;
  currency?: string; // e.g., "dot", "trx"
  address?: string | null; // The generated crypto address
  network?: string; // e.g., "bep20", "trc20"
  user?: WalletGeneratedUser;
  destination_tag?: string | null;
  total_payments?: number | null; // Assuming this could be a number or null
  created_at?: string; // ISO 8601 date string
  updated_at?: string; // ISO 8601 date string
}

// --- Withdrawals Interfaces ---
export interface CreateWithdrawalPayload {
  currency: string;
  amount: string;
  fund_uid: string;
  fund_uid2?: string;
  transaction_note: string;
  narration?: string;
}

export interface Withdrawal {
  id: string;
  currency: string;
  amount: string;
  address: string;
  status: string; // e.g., 'pending', 'completed', 'failed'
  txid?: string; // Transaction ID on the blockchain
  // Add other relevant fields
}

// --- Markets Interfaces ---
export interface Market {
  id: string;
  name: string;
  base_unit: string;
  quote_unit: string;
  min_price: string;
  max_price: string;
  min_amount: string;
  // Add other relevant fields
}

export interface MarketTicker {
  at: number; // Timestamp
  ticker: {
    buy: string;
    sell: string;
    low: string;
    high: string;
    open: string;
    last: string;
    vol: string;
    avg: string;
    // Add other relevant fields
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
  asks: [string, string][]; // [price, amount]
  bids: [string, string][]; // [price, amount]
}

export interface MarketSummary {
  id: string;
  name: string;
  base_unit: string;
  quote_unit: string;
  last: string;
  vol: string;
  // Add other relevant fields
}

// --- Trades Interfaces ---
export interface Trade {
  id: number;
  price: string;
  amount: string;
  total: string;
  market: string;
  created_at: number;
  side: 'buy' | 'sell';
  // Add other relevant fields
}

// --- Deposits Interfaces ---
export interface Deposit {
  id: string;
  currency: string;
  amount: string;
  status: string; // e.g., 'pending', 'completed'
  txid?: string;
  address?: string;
  // Add other relevant fields
}

// --- Swap Interfaces ---
export interface CreateInstantSwapPayload {
  from_currency: string;
  to_currency: string;
  from_amount?: string; // Amount of 'from_currency' to swap
  to_amount?: string; // Desired amount of 'to_currency'
  sub_account_id?: string;
}

export interface TemporarySwapQuotationPayload {
  from_currency: string;
  to_currency: string;
  from_amount?: string; // The amount of from_currency for which to get a quote
  to_amount?: string;
}

export interface TemporarySwapQuotationResponse {
  from_currency: string;
  to_currency: string;
  from_amount: string; // The amount of from_currency for which to get a quote
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
  status: string; // e.g., 'pending', 'completed', 'failed'
  // Add other relevant fields
}

// --- Order Interfaces ---
export interface CreateOrderPayload {
  market_id: string;
  side: 'buy' | 'sell';
  ord_type: 'limit' | 'market';
  price?: string; // Required for limit orders
  volume?: string; // Amount of base currency to buy/sell
  sub_account_id?: string;
}

export interface Order {
  id: string;
  market_id: string;
  side: 'buy' | 'sell';
  ord_type: 'limit' | 'market';
  price: string;
  volume: string;
  state: string; // e.g., 'pending', 'done', 'cancel'
  // Add other relevant fields
}

// --- Beneficiaries Interfaces ---
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
  // Add other relevant fields
}

export interface FeeRange {
  min: number;
  max: number;
  type: 'flat' | 'percentage'; // Assuming 'flat' or 'percentage' for range types
  value: number; // The fee value for this range
}

/**
 * Represents the structure of the 'data' object for crypto withdrawal fees.
 * This interface uses a discriminated union to handle different 'type' values.
 */
export type CryptoWithdrawalFees =
  | {
      type: 'flat';
      fee: number; // For flat fees, 'fee' is a single number
    }
  | {
      type: 'range';
      fee: FeeRange[]; // For range fees, 'fee' is an array of FeeRange objects
    };

// --- Instant Orders Interfaces ---
export interface CreateInstantOrderBuyCryptoFromFiatPayload {
  currency: string; // Crypto currency to buy
  fiat_amount: string; // Fiat amount to spend
  sub_account_id?: string;
}

export interface CreateInstantOrderSellCryptoToFiatPayload {
  currency: string; // Crypto currency to sell
  crypto_amount: string; // Crypto amount to sell
  sub_account_id?: string;
}

export interface CreateInstantOrderBuyCryptoWithVolumePayload {
  currency: string; // Crypto currency to buy
  volume: string; // Fixed volume of crypto to buy
  sub_account_id?: string;
}

export interface InstantOrder {
  id: string;
  currency: string;
  fiat_amount?: string;
  crypto_amount?: string;
  volume?: string;
  status: string; // e.g., 'pending', 'completed'
  // Add other relevant fields
}

// --- RAMP Interfaces ---
export interface PaymentMethod {
  id: string;
  name: string;
  type: string; // e.g., 'bank_transfer', 'card'
  // Add other relevant fields
}

export interface PurchaseLimit {
  currency: string;
  min_amount: string;
  max_amount: string;
  // Add other relevant fields
}

export interface PurchaseQuote {
  from_currency: string;
  to_currency: string;
  amount: string;
  rate: string;
  total_fee: string;
  // Add other relevant fields
}

export interface InitiateOnRampTransactionPayload {
  currency: string; // Crypto currency
  fiat_amount: string;
  payment_method_id: string;
  sub_account_id?: string;
}

export interface InitiateOffRampTransactionPayload {
  currency: string; // Crypto currency
  crypto_amount: string;
  bank_account_id: string;
  sub_account_id?: string;
}

export interface BankAccountOffRampPayload {
  bank_name: string;
  account_number: string;
  account_name: string;
  sub_account_id?: string;
  // Add other relevant fields like bank_code if needed
}

export interface RampTransaction {
  id: string;
  currency: string;
  amount: string;
  status: string;
  type: 'on_ramp' | 'off_ramp';
  // Add other relevant fields
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  // Add other relevant fields
}

// --- CUSTODIAL Interfaces (assuming similar to RAMP but specific to custodial flows) ---
// Note: The API documentation provided did not detail distinct custodial payloads
// beyond what's implied by RAMP. These are placeholders if specific custodial APIs
// require different structures. If they are identical to RAMP, you can reuse those.

// --- Webhook Channels Interfaces ---

/**
 * Generic Quidax Webhook Event structure.
 * @param T The type of data contained within the webhook event.
 */
export interface QuidaxWebhookEvent<T> {
  event: string; // e.g., "deposit.completed", "withdrawal.completed"
  data: T;
  // Add other common webhook fields like `timestamp`, `signature` if Quidax provides them
}

export interface DepositCompletedData {
  id: string;
  currency: string;
  amount: string;
  status: 'completed' | 'pending' | 'failed';
  user_id?: string; // The sub_account_id or user ID associated with the deposit
  txid?: string; // Transaction ID on the blockchain
  address?: string; // Deposit address
  // Add other relevant fields from the actual Quidax deposit webhook payload
}

export interface WithdrawalCompletedData {
  id: string;
  currency: string;
  amount: string;
  status: 'completed' | 'pending' | 'failed';
  user_id?: string; // The sub_account_id or user ID associated with the withdrawal
  address: string; // Destination address of the withdrawal
  txid?: string; // Transaction ID on the blockchain
  // Add other relevant fields from the actual Quidax withdrawal webhook payload
}

export interface OrderFilledData {
  id: string;
  market_id: string;
  side: 'buy' | 'sell';
  price: string;
  volume: string;
  status: 'filled' | 'partial_fill';
  user_id?: string; // The sub_account_id or user ID associated with the order
  // Add other relevant fields
}

export interface SwapCompletedData {
  id: string;
  from_currency: string;
  to_currency: string;
  from_amount: string;
  to_amount: string;
  status: 'completed' | 'pending' | 'failed';
  user_id?: string; // The sub_account_id or user ID associated with the swap
  // Add other relevant fields
}

export interface WalletGeneratedData {
  id: string;
  reference?: string | null;
  address: string;
  currency: string;
  network: string;
  user: {
    id: string;
    sn: string;
    email: string;
    reference?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    created_at: string;
    updated_at: string;
    display_name?: any | null;
  };
  destination_tag: string;
  total_paymnents: any | null;
  created_at: string;
  updated_at: string;
}
