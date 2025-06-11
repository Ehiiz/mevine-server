// Base URLs for different VFD API products
export const BASE_URL_WALLETS_TEST =
  'https://api-devapps.vfdbank.systems/vtech-wallet/api/v2/wallet2';
export const BASE_URL_WALLETS_LIVE =
  'https://api-apps.vfdbank.systems/vtech-wallet/api/v2/wallet2';
export const BASE_URL_BILLSPAYMENT_TEST =
  'https://api-devapps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore';
export const BASE_URL_BILLSPAYMENT_LIVE =
  'https://api-apps.vfdbank.systems/vtech-bills/api/v2/billspaymentstore';

// Wallets API Endpoints
// Account Information & Transfers
export const WALLET_ACCOUNT_ENQUIRY = '/account/enquiry';
export const WALLET_BANKS = '/bank';
export const WALLET_TRANSFER_RECIPIENT = '/transfer/recipient';
export const WALLET_TRANSFER = '/transfer';
export const WALLET_TRANSACTION_DETAILS = '/transactions'; // For retrieving details of a single transaction by reference/sessionId
export const WALLET_CREDIT_SIMULATION = '/credit'; // Dev environment inflow simulation
export const WALLET_TRANSACTION_REVERSAL_STATUS = '/transactions/reversal';
export const WALLET_RETRIGGER_WEBHOOK_NOTIFICATION = '/transactions/repush';

// Account Creation (No Consent Method)
export const WALLET_CLIENT_CREATE_NO_CONSENT = '/client/create'; // Individual client creation with BVN/DOB mandatory
export const WALLET_CORPORATE_CLIENT_CREATE_NO_CONSENT =
  '/corporateclient/create';
export const WALLET_VIRTUAL_ACCOUNT_CREATE = '/virtualaccount'; // One-time temporary virtual account
export const WALLET_VIRTUAL_ACCOUNT_AMOUNT_UPDATE =
  '/virtualaccount/amountupdate';

// Account Creation (Consent Method)
export const WALLET_CLIENT_INDIVIDUAL_CONSENT = '/client/individual'; // Individual client creation with BVN mandatory
export const WALLET_CLIENT_CORPORATE_CONSENT = '/client/corporate'; // Corporate collections account creation
export const WALLET_BVN_CONSENT = '/bvn-consent'; // To obtain/get consent to a customer's BVN
export const WALLET_CLIENT_RELEASE_PND = '/client/release'; // Remove PND from an account after consent

// KYC & BVN Enquiry
export const WALLET_CLIENT_BVN_DETAILS = '/client'; // Retrieve BVN details of a customer
export const WALLET_BVN_ACCOUNT_LOOKUP = '/bvn-account-lookup'; // Retrieve bank accounts linked with a BVN

// Account Enquiry
export const WALLET_SUB_ACCOUNTS = '/sub-accounts'; // Retrieve virtual, corporate, or individual accounts

// Transaction Enquiry & Limits
export const WALLET_TRANSACTION_LIMIT = '/transaction/limit'; // Modify customer's daily limits
export const WALLET_ACCOUNT_TRANSACTIONS = '/account/transactions'; // Retrieve all transactions from pool/sub-account
export const WALLET_VIRTUAL_ACCOUNT_TRANSACTIONS =
  '/virtualaccount/transactions'; // Retrieve virtual account transaction history

// QR Code Services
export const WALLET_QRCODE_GENERATE = '/qrcode/generate';
export const WALLET_QRCODE_QUERY = '/qrcode/query';
export const WALLET_QRCODE_PAY = '/qrcode/pay';

// Account Upgrade (Tiered Accounts)
export const WALLET_CLIENT_UPGRADE = '/client/update';
export const WALLET_CLIENT_TIERS_INDIVIDUAL = '/client/tiers/individual';
export const WALLET_CLIENT_TIERS_CORPORATE = '/client/tiers/corporate';

// Bills Payment API Endpoints
export const BILLS_PAYMENT_BILLER_CATEGORY = '/billercategory';
export const BILLS_PAYMENT_BILLER_LIST = '/billerlist';
export const BILLS_PAYMENT_BILLER_ITEMS = '/billerItems';
export const BILLS_PAYMENT_CUSTOMER_VALIDATE = '/customervalidate';
export const BILLS_PAYMENT_PAY_BILL = '/pay';
export const BILLS_PAYMENT_TRANSACTION_STATUS = '/transactionStatus';
