import { N } from '@faker-js/faker/dist/airline-BUL6NtOJ';

export interface QuidaxApiResponse<T> {
  code: number;
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
  // Add other relevant fields as per Quidax documentation
}

// --- Wallets Interfaces ---
export interface CreatePaymentAddressPayload {
  currency: string;
  sub_account_id?: string; // Optional if using master account
}

export interface ReEnqueGeneratedWalletAddressPayload {
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

export interface PaymentAddress {
  id: string;
  address: string;
  currency: string;
  state: string; // e.g., 'active', 'pending'
  // Add other relevant fields
}

// --- Withdrawals Interfaces ---
export interface CreateWithdrawalPayload {
  currency: string;
  amount: string;
  address: string;
  narration?: string;
  sub_account_id?: string; // If withdrawing from a sub-account
  beneficiary_id?: string; // If withdrawing to a saved beneficiary
  // Add other relevant fields like `otp` or `pin` if required by Quidax for withdrawals
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
  amount: string; // The amount of from_currency for which to get a quote
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

// --- Fees Interfaces ---
export interface CryptoWithdrawalFees {
  currency: string;
  amount: string;
  fee: string;
  // Add other relevant fields
}

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
