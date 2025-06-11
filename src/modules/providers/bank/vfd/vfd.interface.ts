// --- Common Interfaces ---

export interface VfdApiResponse<T> {
  status: string; // "00" for success, others for failure/pending
  message: string;
  data?: T;
}

export interface VfdApiErrorResponse {
  status: string;
  message: string;
  data?: any; // Contains specific error details if available
}

export enum VfdApiTransactionStatus {
  SUCCESSFUL = '00',
  PENDING_01 = '01',
  PENDING_02 = '02',
  PENDING_09 = '09',
  PENDING_25 = '25',
  PENDING_94 = '94',
  PENDING_96 = '96',
  PENDING_500 = '500', // Internal Server Error can be pending too
  FAILED_03 = '03',
  FAILED_05 = '05',
  FAILED_06 = '06',
  FAILED_07 = '07',
  FAILED_08 = '08',
  FAILED_12 = '12',
  FAILED_13 = '13',
  FAILED_14 = '14',
  FAILED_15 = '15',
  FAILED_16 = '16',
  FAILED_17 = '17',
  FAILED_18 = '18',
  FAILED_21 = '21', // Failed with reversal
  FAILED_30 = '30',
  FAILED_34 = '34',
  FAILED_35 = '35',
  FAILED_51 = '51', // No Sufficient Funds
  FAILED_57 = '57',
  FAILED_58 = '58',
  FAILED_61 = '61',
  FAILED_63 = '63',
  FAILED_65 = '65',
  FAILED_68 = '68',
  FAILED_69 = '69',
  FAILED_70 = '70',
  FAILED_71 = '71',
  FAILED_81 = '81',
  FAILED_91 = '91',
  FAILED_92 = '92',
  FAILED_97 = '97',
  FAILED_98 = '98', // Transaction Exist
  FAILED_99 = '99', // Transaction Failed
}

// --- Wallets API Interfaces ---

// 1. Account Enquiry
export interface AccountEnquiryResponseData {
  accountNo: string;
  accountBalance: string; // API returns string, convert to number if needed
  accountId: string;
  client: string; // Client name
  clientId: string;
  savingsProductName: string;
}

export type AccountEnquiryResponse = VfdApiResponse<AccountEnquiryResponseData>;

// 2. Bank List
export interface Bank {
  bankName: string;
  bankCode: string;
}

export type BankListResponse = VfdApiResponse<Bank[]>;

// 3. Transfer Recipient Enquiry
export interface TransferRecipientRequest {
  accountNo: string;
  bank: string; // Bank Code
  transfer_type: 'intra' | 'inter';
}

export interface TransferRecipientResponseData {
  name: string;
  clientId: string;
  bvn?: string; // Optional
  account: {
    number: string;
    id: string; // savingsId
  };
  status: string; // e.g., "active"
  currency: string;
  bank: string; // Bank name
}

export type TransferRecipientResponse =
  VfdApiResponse<TransferRecipientResponseData>;

// 4. Transfer
export interface TransferRequest {
  fromAccount: string;
  uniqueSenderAccountId?: string; // Optional, only for Pool implementation sub-accounts
  fromClientId: string;
  fromClient: string;
  fromSavingsId: string;
  fromBvn?: string; // If present, should be passed
  toClientId?: string; // Mandatory for Intra, optional for Inter
  toClient: string;
  toSavingsId?: string; // Mandatory for Intra, optional for Inter
  toSession?: string; // Mandatory for Inter, optional for Intra (beneficiary sessionId)
  toBvn?: string; // If present, should be passed
  toAccount: string;
  toBank: string; // Bank Code (from /bank endpoint)
  signature: string; // SHA512(fromAccount + ToAccount)
  amount: string; // Amount as string
  remark: string;
  transferType: 'intra' | 'inter';
  reference: string; // Unique, prefixed with wallet name
}

export interface TransferResponseData {
  txnId: string; // transaction reference
  sessionId?: string; // For inter transfers
  reference?: string; // External reference
}

export type TransferResponse = VfdApiResponse<TransferResponseData>;

// 5. Account Creation (No Consent Method)
export interface ClientCreateNoConsentRequest {
  bvn?: string; // Mandatory for new account creation
  dateOfBirth?: string; // "08-Mar-1995" - Mandatory for new account creation
  // For duplicate account:
  previousAccountNo?: string; // Query param for client/create, body for corporateclient/create
}

export interface CorporateClientCreateNoConsentRequest {
  rcNumber: string;
  companyName: string;
  incorporationDate: string; // "05 January 2021"
  bvn: string; // BVN of one of company's board of directors
  previousAccountNo?: string; // For duplicate
}

export interface ClientCreationResponseData {
  firstname?: string;
  middlename?: string;
  lastname?: string;
  bvn?: string;
  phone?: string;
  dob?: string;
  accountNo: string;
  accountName?: string; // For corporate
}

export type ClientCreationResponse = VfdApiResponse<ClientCreationResponseData>;

// 6. Virtual Account
export interface VirtualAccountCreateRequest {
  amount: string;
  merchantName: string;
  merchantId: string;
  reference: string; // Unique, prefixed with wallet name
  validityTime?: string; // Optional, in minutes, default 4320, max 4320
  amountValidation?: 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5'; // Optional, default A4
}

export interface VirtualAccountCreateResponseData {
  accountNumber: string;
  reference: string;
}

export type VirtualAccountCreateResponse =
  VfdApiResponse<VirtualAccountCreateResponseData>;

// 7. Virtual Account Update
export interface VirtualAccountAmountUpdateRequest {
  amount: string;
  reference: string; // Unique reference used to generate the virtual account initially
}

export interface VirtualAccountAmountUpdateResponseData {
  amount: string;
  merchantAccountNo: string;
  merchantId: string;
}

export type VirtualAccountAmountUpdateResponse =
  VfdApiResponse<VirtualAccountAmountUpdateResponseData>;

// 8. BVN Consent
export interface BvnConsentRequest {
  bvn: string;
  type: string; // e.g., "02" or "03"
  reference?: string; // Unique reference (max 250 characters)
}

export interface BvnConsentResponseData {
  statusCode: 'true' | 'false' | string; // 'true'/'false' as string, or actual status code
  url?: string; // Present if statusCode is 'false' (consent not given)
  reference: string; // Unique reference from the request
}

export type BvnConsentResponse = VfdApiResponse<BvnConsentResponseData>;

// 9. Client Release PND
export interface ClientReleaseRequest {
  accountNo: string;
}

export type ClientReleaseResponse = VfdApiResponse<{}>;

// 10. Credit Simulation
export interface CreditSimulationRequest {
  amount: string;
  accountNo: string; // Account to receive funding
  senderAccountNo: string; // Account to initiate disbursement
  senderBank: string; // Bank Code of senderAccountNo
  senderNarration: string;
}

export type CreditSimulationResponse = VfdApiResponse<{}>;

// 11. Get User BVN Details (KYC Enquiry)
export interface BvnDetailsResponseData {
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string; // "05-Oct-1988"
  phoneNo: string;
  pixBase64: string; // Base64 encoded image
}

export type GetUserBvnDetailsResponse = VfdApiResponse<BvnDetailsResponseData>;

// 12. BVN Account Lookup
export interface BvnAccountLookupResponseData {
  accountname: string;
  accountnumber: string;
  accountDesignation: string; // e.g., "2"
  accountstatus: string; // e.g., "1"
  accounttype: string; // e.g., "2"
  institution: string; // e.g., "9"
  branch: string; // e.g., "0491"
  accounttier: string; // e.g., "0"
  nipCode: string; // e.g., "000004"
  BankCode: string; // e.g., "033"
  BankName: string; // e.g., "UBA Bank"
  AccountDesignationName: string; // e.g., "INDIVIDUAL"
  AccountTypeName: string; // e.g., "SAVINGS"
}

export type BvnAccountLookupResponse = VfdApiResponse<
  BvnAccountLookupResponseData[]
>;

// 13. Sub Accounts
export interface SubAccountsRequest {
  entity: 'virtual' | 'individual' | 'corporate';
  page: number;
  size: number;
}

export interface SubAccount {
  lastName?: string;
  phone?: string;
  firstName?: string;
  createdDate: string; // "2023-06-08 16:21:40.0"
  clientId?: string;
  bvn?: string;
  accountNo: string;
  // corporate specific fields
  companyName?: string;
  rcNumber?: string;
  incorporationDate?: string;
}

export interface SubAccountsResponseData {
  content: SubAccount[];
  totalElements: number;
  totalPages: number;
}

export type SubAccountsResponse = VfdApiResponse<SubAccountsResponseData>;

// 14. Account Transactions (General)
export type TransactionType = 'wallet' | 'bank'; // As per documentation for /account/transactions
export type TransactionFlowType = 'INFLOW' | 'OUTFLOW' | 'CREDIT' | 'DEBIT'; // Example from responses

export interface AccountTransactionsRequest {
  accountNo: string;
  startDate: string; // "2023-01-01 00:00:00"
  endDate: string; // "2023-03-01 23:59:59"
  transactionType: TransactionType;
  page?: number;
  size?: number;
}

export interface AccountTransaction {
  accountNo: string;
  receiptNumber?: string;
  amount: string; // "20.000000"
  remarks: string;
  createdDate: string; // "2023-11-30 06:43:23.0"
  transactionType: TransactionFlowType;
  runningBalance?: string; // "1074467.000000"
  currencyCode?: string;
  id?: string;
  time?: string; // For wallet transactions
  walletName?: string; // For wallet transactions
  toAccountNo?: string;
  transactionResponse?: string; // e.g. "00"
  fromBank?: string;
  fromAccountNo?: string;
  toBank?: string;
  sessionId?: string;
  bankTransactionId?: string;
  token?: string; // Specific to some Bill payments like electricity
}

export interface AccountTransactionsResponseData {
  content: AccountTransaction[];
  totalElements: number;
  totalPages: number;
}

export type AccountTransactionsResponse =
  VfdApiResponse<AccountTransactionsResponseData>;

// 15. Virtual Account Transactions
export interface VirtualAccountTransactionsRequest {
  accountNumber: string;
  startDate: string; // "2022-01-01 00:00:00"
  endDate: string; // "2023-01-01 23:59:59"
  page?: number;
  size?: number;
}

export interface VirtualAccountTransaction {
  reference: string;
  dateCreated: string; // "2023-10-31 13:39:05.0"
  merchantAccountNo: string;
  merchantAccountName: string;
  accountStatus: string; // e.g., "09"
  amount: string; // "2000"
  expired: string; // "false" as string
  amountValidation: string; // "A3"
}

export interface VirtualAccountTransactionsResponseData {
  content: VirtualAccountTransaction[];
  totalElements: number;
  totalPages: number;
}

export type VirtualAccountTransactionsResponse =
  VfdApiResponse<VirtualAccountTransactionsResponseData>;

// 16. Transaction Limit
export interface TransactionLimitRequest {
  accountNumber: string;
  transactionLimit: string; // Amount as string
  dailyLimit: string; // Amount as string
}

export type TransactionLimitResponse = VfdApiResponse<{}>;

// 17. Transaction Status Query
export interface TransactionStatusQueryRequest {
  reference?: string;
  sessionId?: string;
}

export interface TransactionStatusQueryResponseData {
  TxnId: string;
  amount: string;
  accountNo: string;
  fromAccountNo?: string;
  transactionStatus: string; // e.g., "00", "99"
  transactionDate: string; // "2023-01-11 08:05:25.0"
  toBank?: string;
  fromBank?: string;
  sessionId?: string;
  bankTransactionId?: string;
  transactionType?: string; // e.g., "OUTFLOW"
  token?: string; // Specific to some Bill payments like electricity
}

export type TransactionStatusQueryResponse =
  VfdApiResponse<TransactionStatusQueryResponseData>;

// 18. Transaction Reversal Status Query
export interface TransactionReversalStatusQueryRequest {
  reference: string;
}

export type TransactionReversalStatusQueryResponse =
  VfdApiResponse<TransactionStatusQueryResponseData>; // Same data structure as TSQ

// 19. Client Tiered Account Creation (Individual)
export interface ClientTierIndividualRequest {
  nin?: string;
  bvn?: string;
  dateOfBirth: string; // "YYYY-MM-DD" or "DD-MMM-YYYY" format
  address?: string; // Mandatory for Tier 3
  previousAccountNo?: string; // For duplicate creation
}

export interface ClientTierIndividualResponseData {
  firstname: string;
  middlename?: string;
  lastname: string;
  currentTier: string; // "1", "2", "3"
  accountNo: string;
  ninVerification?: string; // "Successful"
  ninValidation?: string; // "Successful"
  bvnVerification?: string; // "Successful"
  bvnValidation?: string; // "Successful"
  nameMatch?: string; // "true"
  address?: string;
}

export type ClientTierIndividualResponse =
  VfdApiResponse<ClientTierIndividualResponseData>;

// 20. Client Tiered Account Creation (Corporate)
export interface ClientTierCorporateRequest {
  rcNumber: string;
  companyName: string;
  incorporationDate: string; // "DD MonthYYYY" e.g., "05 January 2021"
  bvn: string; // BVN of one of company's board of directors
  nin: string; // NIN of one of company's board of directors
  tin?: string; // Optional
  address: string;
  previousAccountNo?: string; // For duplicate creation
  // For sub-account creation:
  parentAccountNo?: string;
  branch?: string; // For branch account
  type?: string; // For purpose-based account (e.g., "Settlement")
}

export interface ClientTierCorporateResponseData {
  accountNo: string;
  accountName: string;
}

export type ClientTierCorporateResponse =
  VfdApiResponse<ClientTierCorporateResponseData>;

// 21. Client Upgrade (Existing Individual Account)
export interface ClientUpgradeRequest {
  accountNo: string;
  bvn?: string; // For upgrade to Tier 2/3 from Tier 1 (NIN-only)
  nin?: string; // For upgrade to Tier 2/3 from Tier 1 (BVN-only)
  address?: string; // Optional for Tier 3 upgrade
  companyName?: string; // For converting individual to corporate
  incorporationDate?: string; // For converting individual to corporate
  rcNumber?: string; // For converting individual to corporate
  action: 'Update-BVN' | 'Recomply-With-BVN' | 'Convert-To-Corporate';
  dob?: string; // Mandatory for Recomply-With-BVN
}

export type ClientUpgradeResponse = VfdApiResponse<{}>;

// --- Bills Payment API Interfaces ---

// 1. Biller Category
export interface BillerCategory {
  category: string;
}

export type BillerCategoryResponse = VfdApiResponse<BillerCategory[]>;

// 2. Biller List
export interface BillerListRequest {
  categoryName?: string;
}

export interface Biller {
  id: string; // billerId
  name: string; // biller name
  division: string;
  product: string; // productId
  category: string;
  convenienceFee?: string; // Optional, "30" as string
}

export type BillerListResponse = VfdApiResponse<Biller[]>;

// 3. Biller Items
export interface BillerItemsRequest {
  billerId: string;
  divisionId: string;
  productId: string;
}

export interface BillerItem {
  id: string;
  billerid: string;
  amount: string; // "0" as string
  code: string; // e.g. "2"
  paymentitemname: string;
  productId: string;
  paymentitemid: string;
  currencySymbol: string;
  isAmountFixed: string; // "false" as string
  itemFee: string; // "0" as string
  itemCurrencySymbol: string;
  pictureId: string;
  paymentCode: string; // This is important for validate customer and pay bills
  sortOrder: string;
  billerType: string;
  payDirectitemCode: string;
  currencyCode: string;
  division: string;
  categoryid: string;
  createdDate: string; // "2022-10-18 10:11:43"
}

export interface BillerItemsResponseData {
  paymentitems: BillerItem[];
}

export type BillerItemsResponse = VfdApiResponse<BillerItemsResponseData>;

// 4. Validate Customer
export interface CustomerValidateRequest {
  customerId: string;
  divisionId: string;
  paymentItem: string; // from billerItems.paymentCode
  billerId: string; // from billerList.id
}

export type CustomerValidateResponse = VfdApiResponse<{
  /* empty data object for success */
}>;

// 5. Pay Bills
export interface PayBillRequest {
  customerId: string; // Phone Number or Meter Number
  amount: string; // Bill cost
  division: string; // from billerList.division
  paymentItem: string; // from billerItems.paymentCode
  productId: string; // from billerList.product
  billerId: string; // from billerList.id
  reference: string; // Unique, prefixed with walletName or name of choice
  phoneNumber?: string; // Optional for some products (e.g., electricity)
}

export interface PayBillResponseData {
  reference: string;
  // For electricity, might also return 'token' and KCT1, KCT2
  token?: string;
  KCT1?: string;
  KCT2?: string;
}

export type PayBillResponse = VfdApiResponse<PayBillResponseData>;

// 6. Bill Transaction Status
export interface BillTransactionStatusRequest {
  transactionId: string; // transaction reference
}

export interface BillTransactionStatusResponseData {
  transactionStatus: string; // "00", "09", "99"
  amount: string;
  token?: string; // For electricity, might be the energy credit token
}

export type BillTransactionStatusResponse =
  VfdApiResponse<BillTransactionStatusResponseData>;
