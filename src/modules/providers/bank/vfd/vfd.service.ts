import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Inject, // Import Inject decorator
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import * as VFDUrls from './vfd.constants'; // Import all URL constants
import {
  AccountEnquiryResponse,
  AccountEnquiryResponseData,
  BankListResponse,
  BvnConsentRequest,
  BvnConsentResponse,
  ClientCreationResponse,
  ClientCreateNoConsentRequest,
  CorporateClientCreateNoConsentRequest,
  VirtualAccountCreateRequest,
  VirtualAccountCreateResponse,
  TransferRecipientRequest,
  TransferRecipientResponse,
  TransferRequest,
  TransferResponse,
  CreditSimulationRequest,
  CreditSimulationResponse,
  GetUserBvnDetailsResponse,
  AccountTransactionsRequest,
  AccountTransactionsResponse,
  VirtualAccountTransactionsRequest,
  VirtualAccountTransactionsResponse,
  TransactionStatusQueryRequest,
  TransactionStatusQueryResponse,
  ClientReleaseRequest,
  ClientReleaseResponse,
  VfdApiErrorResponse,
  BillerCategoryResponse,
  BillerListRequest,
  BillerListResponse,
  BillerItemsRequest,
  BillerItemsResponse,
  CustomerValidateRequest,
  CustomerValidateResponse,
  PayBillRequest,
  PayBillResponse,
  BillTransactionStatusRequest,
  BillTransactionStatusResponse,
} from './vfd.interface'; // Import all interfaces
import { BILLS_HTTP_SERVICE, WALLETS_HTTP_SERVICE } from './vfd.module';
import { ConfigService } from '@nestjs/config';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class VFDHttpServiceFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) {}

  createWalletsHttpService(): HttpService {
    const axiosInstance = axios.create({
      baseURL: this.configService.get<string>('VFD_WALLETS_BASE_URL') ?? '',
      headers: {
        'Content-Type': 'application/json',
        AccessToken:
          this.configService.get<string>('VFD_WALLET_ACCESS_TOKEN') ?? '',
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    return new HttpService(axiosInstance);
  }

  createBillsHttpService(): HttpService {
    const axiosInstance = axios.create({
      baseURL:
        this.configService.get<string>('VFD_BILLSPAYMENT_BASE_URL') ?? '',
      headers: {
        'Content-Type': 'application/json',
        AccessToken:
          this.configService.get<string>('VFD_WALLET_ACCESS_TOKEN') ?? '',
      },
      timeout: 30000,
      maxRedirects: 5,
    });

    return new HttpService(axiosInstance);
  }
}

@Injectable()
export class VFDService {
  private readonly logger = new Logger(VFDService.name);
  private readonly walletsHttpService: HttpService;
  private readonly billsHttpService: HttpService;

  constructor(private readonly httpServiceFactory: VFDHttpServiceFactory) {
    this.walletsHttpService =
      this.httpServiceFactory.createWalletsHttpService();
    this.billsHttpService = this.httpServiceFactory.createBillsHttpService();

    this.logger.log(
      'VFDService initialized with factory-created HttpService instances.',
    );
  }

  /**
   * Helper function to construct a full URL with optional query parameters.
   * This helper now only adds query parameters to a given endpoint path.
   * The base URL is implicitly handled by the HttpService instance configured in the module.
   * @param endpoint The specific API endpoint path (e.g., '/bank').
   * @param queryParams Optional object of key-value pairs for query parameters.
   * @returns The constructed endpoint path with query parameters.
   */
  private buildUrlPath<
    T extends Record<string, string | number | boolean | null | undefined>,
  >(endpoint: string, queryParams?: T): string {
    if (!queryParams) return endpoint;

    const params = new URLSearchParams();
    for (const key in queryParams) {
      const value = queryParams[key];
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    }
    const queryString = params.toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }

  /**
   * Generic error handling for Axios requests.
   * Logs the error and throws a NestJS BadGatewayException or InternalServerErrorException.
   */
  private handleError(error: AxiosError, methodName: string): never {
    this.logger.error(
      `Error in ${methodName}:`,
      error.response?.data || error.message,
    );
    if (error.response) {
      const apiError: VfdApiErrorResponse = error.response
        .data as VfdApiErrorResponse;
      throw new BadGatewayException(
        apiError.message || `An external API error occurred in ${methodName}.`,
      );
    }
    throw new InternalServerErrorException(
      `An unexpected error occurred in ${methodName} while communicating with the VFD API.`,
    );
  }

  /**
   * Fetches the list of all Nigerian banks and bank codes.
   */
  async fetchBanks(): Promise<BankListResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.WALLET_BANKS);
    this.logger.debug(`Fetching banks from wallets API using path: ${urlPath}`);
    const { data } = await firstValueFrom(
      this.walletsHttpService.get<BankListResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'fetchBanks'),
        ),
      ),
    );
    return data;
  }

  /**
   * Gets account details for a sender to initiate a transfer request or check balance.
   * If `accountNumber` is not passed, returns pool account details.
   */
  async getAccountBalance(
    accountNumber?: string,
  ): Promise<AccountEnquiryResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.WALLET_ACCOUNT_ENQUIRY, {
      accountNumber,
    });
    this.logger.debug(
      `Fetching account balance for ${accountNumber || 'pool account'} using path: ${urlPath}`,
    );

    const { data } = await firstValueFrom(
      this.walletsHttpService.get<AccountEnquiryResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'getAccountBalance'),
        ),
      ),
    );
    return data;
  }

  /**
   * Creates a client (individual or corporate) account using the No Consent Method (non-tiered).
   * Supports new account creation and duplicate account creation.
   *
   * @param payload The request body for client creation.
   * @param isCorporate Flag to indicate if it's a corporate client.
   * @param queryParams Optional query parameters for specific scenarios (e.g., `previousAccountNo` for individual duplicate).
   */
  async createWalletNoConsent(
    payload:
      | ClientCreateNoConsentRequest
      | CorporateClientCreateNoConsentRequest,
    isCorporate: boolean = false,
    queryParams?: { previousAccountNo?: string },
  ): Promise<ClientCreationResponse> {
    let endpoint: string;
    let requestBody: any = payload;
    let finalQueryParams: any = { ...queryParams }; // Start with provided query params

    if (isCorporate) {
      endpoint = VFDUrls.WALLET_CORPORATE_CLIENT_CREATE_NO_CONSENT;
      // Corporate duplicate uses previousAccountNo in body as per doc.
      // If previousAccountNo is provided via queryParams (e.g., for consistency in method signature),
      // transfer it to the body. If it's already in the payload, this is redundant.
      if (finalQueryParams.previousAccountNo) {
        requestBody = {
          ...requestBody,
          previousAccountNo: finalQueryParams.previousAccountNo,
        };
        delete finalQueryParams.previousAccountNo; // Remove from query params if used in body
      }
    } else {
      endpoint = VFDUrls.WALLET_CLIENT_CREATE_NO_CONSENT;
      // Individual client creation: BVN and DOB are mandatory as query params for new accounts.
      if (!finalQueryParams.previousAccountNo) {
        // If not a duplicate, BVN/DOB are query params
        const individualPayload = payload as ClientCreateNoConsentRequest;
        if (!individualPayload.bvn || !individualPayload.dateOfBirth) {
          throw new BadRequestException(
            'BVN and dateOfBirth are mandatory for new individual wallet creation.',
          );
        }
        finalQueryParams = {
          ...finalQueryParams,
          bvn: individualPayload.bvn,
          dateOfBirth: individualPayload.dateOfBirth,
        };
        // Ensure the actual POST body is empty or clean if fields are moved to query.
        // Assuming original payload has bvn/dob, remove them from the body for post.
        const { bvn, dateOfBirth, ...restPayload } = individualPayload;
        requestBody = restPayload;
      }
    }

    const urlPath = this.buildUrlPath(endpoint, finalQueryParams);
    this.logger.debug(
      `Creating No-Consent Wallet (Corporate: ${isCorporate}) at path: ${urlPath}`,
    );

    const { data } = await firstValueFrom(
      this.walletsHttpService
        .post<ClientCreationResponse>(urlPath, requestBody)
        .pipe(
          // Removed headers
          catchError((error: AxiosError) =>
            this.handleError(
              error,
              `createWalletNoConsent (${isCorporate ? 'corporate' : 'individual'})`,
            ),
          ),
        ),
    );
    return data;
  }

  /**
   * Creates a one-time temporary virtual account.
   */
  async createVirtualAccount(
    requestBody: VirtualAccountCreateRequest,
  ): Promise<VirtualAccountCreateResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.WALLET_VIRTUAL_ACCOUNT_CREATE);
    this.logger.debug(`Creating Virtual Account using path: ${urlPath}`);

    const { data } = await firstValueFrom(
      this.walletsHttpService
        .post<VirtualAccountCreateResponse>(urlPath, requestBody)
        .pipe(
          // Removed headers
          catchError((error: AxiosError) =>
            this.handleError(error, 'createVirtualAccount'),
          ),
        ),
    );
    return data;
  }

  /**
   * Verifies bank details to get transfer recipient information.
   */
  async verifyBankDetails(
    requestParams: TransferRecipientRequest,
  ): Promise<TransferRecipientResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.WALLET_TRANSFER_RECIPIENT, {
      ...requestParams,
    });
    this.logger.debug(
      `Verifying bank details for recipient using path: ${urlPath}`,
    );

    const { data } = await firstValueFrom(
      this.walletsHttpService.get<TransferRecipientResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'verifyBankDetails'),
        ),
      ),
    );
    return data;
  }

  /**
   * Initiates an intra or inter-funds transfer.
   * The `signature` field must be correctly generated externally as per documentation.
   */
  async transferFunds(requestBody: TransferRequest): Promise<TransferResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.WALLET_TRANSFER);
    this.logger.debug(
      `Initiating transfer to: ${requestBody.toAccount} (${requestBody.transferType}) using path: ${urlPath}`,
    );

    const { data } = await firstValueFrom(
      this.walletsHttpService.post<TransferResponse>(urlPath, requestBody).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'transferFunds'),
        ),
      ),
    );
    return data;
  }

  /**
   * Obtains consent for a customer's BVN.
   */
  async getBvnConsent(
    requestParams: BvnConsentRequest,
  ): Promise<BvnConsentResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.WALLET_BVN_CONSENT, {
      ...requestParams,
    });
    this.logger.debug(
      `Getting BVN Consent for BVN: ${requestParams.bvn} using path: ${urlPath}`,
    );

    const { data } = await firstValueFrom(
      this.walletsHttpService.get<BvnConsentResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'getBvnConsent'),
        ),
      ),
    );
    return data;
  }

  /**
   * Releases PND (Post No Debit) from a created account after BVN consent is obtained.
   */
  async releaseAccountPND(
    requestBody: ClientReleaseRequest,
  ): Promise<ClientReleaseResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.WALLET_CLIENT_RELEASE_PND);
    this.logger.debug(
      `Releasing account PND for: ${requestBody.accountNo} using path: ${urlPath}`,
    );

    const { data } = await firstValueFrom(
      this.walletsHttpService
        .post<ClientReleaseResponse>(urlPath, requestBody)
        .pipe(
          // Removed headers
          catchError((error: AxiosError) =>
            this.handleError(error, 'releaseAccountPND'),
          ),
        ),
    );
    return data;
  }

  /**
   * Simulates an inward credit to your pool account (for dev environment).
   */
  async simulateVirtualWalletCredit(
    requestBody: CreditSimulationRequest,
  ): Promise<CreditSimulationResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.WALLET_CREDIT_SIMULATION);
    this.logger.debug(
      `Simulating credit for account: ${requestBody.accountNo} using path: ${urlPath}`,
    );

    const { data } = await firstValueFrom(
      this.walletsHttpService
        .post<CreditSimulationResponse>(urlPath, requestBody)
        .pipe(
          // Removed headers
          catchError((error: AxiosError) =>
            this.handleError(error, 'simulateVirtualWalletCredit'),
          ),
        ),
    );
    return data;
  }

  /**
   * Retrieves BVN details of a customer (KYC Enquiry).
   */
  async getUserBvnDetails(bvn: string): Promise<GetUserBvnDetailsResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.WALLET_CLIENT_BVN_DETAILS, {
      bvn,
    });
    this.logger.debug(
      `Getting user BVN details for: ${bvn} using path: ${urlPath}`,
    );

    const { data } = await firstValueFrom(
      this.walletsHttpService.get<GetUserBvnDetailsResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'getUserBvnDetails'),
        ),
      ),
    );
    return data;
  }

  /**
   * Retrieves account transactions (pool, sub-accounts, virtual accounts).
   * Can fetch wallet-based transactions or bank statements.
   */
  async getTransactions(
    requestParams: AccountTransactionsRequest,
  ): Promise<AccountTransactionsResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.WALLET_ACCOUNT_TRANSACTIONS, {
      ...requestParams,
    });
    this.logger.debug(
      `Getting transactions for account: ${requestParams.accountNo} (Type: ${requestParams.transactionType}) using path: ${urlPath}`,
    );

    const { data } = await firstValueFrom(
      this.walletsHttpService.get<AccountTransactionsResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'getTransactions'),
        ),
      ),
    );
    return data;
  }

  /**
   * Queries the status of a transaction by providing either the transaction reference or sessionId.
   */
  async getTransactionStatus(
    requestParams: TransactionStatusQueryRequest,
  ): Promise<TransactionStatusQueryResponse> {
    if (!requestParams.reference && !requestParams.sessionId) {
      throw new BadRequestException(
        'Either transaction reference or sessionId is mandatory.',
      );
    }
    const urlPath = this.buildUrlPath(VFDUrls.WALLET_TRANSACTION_DETAILS, {
      ...requestParams,
    });
    this.logger.debug(
      `Getting transaction status for: ${requestParams.reference || requestParams.sessionId} using path: ${urlPath}`,
    );

    const { data } = await firstValueFrom(
      this.walletsHttpService.get<TransactionStatusQueryResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'getTransactionStatus'),
        ),
      ),
    );
    return data;
  }

  // --- Bills Payment Services ---

  /**
   * Returns a list of biller categories.
   */
  async getBillerCategories(): Promise<BillerCategoryResponse> {
    console.log('I got here');
    const urlPath = this.buildUrlPath(VFDUrls.BILLS_PAYMENT_BILLER_CATEGORY);
    this.logger.debug(
      `Fetching biller categories from bills payment API using path: ${urlPath}`,
    );
    const { data } = await firstValueFrom(
      this.billsHttpService.get<BillerCategoryResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'getBillerCategories'),
        ),
      ),
    );
    return data;
  }

  /**
   * Returns a list of billers for a particular category, or all if categoryName is not passed.
   */
  async getBillerList(categoryName?: string): Promise<BillerListResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.BILLS_PAYMENT_BILLER_LIST, {
      categoryName,
    });
    this.logger.debug(
      `Fetching biller list for category: ${categoryName || 'all'} using path: ${urlPath}`,
    );
    const { data } = await firstValueFrom(
      this.billsHttpService.get<BillerListResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'getBillerList'),
        ),
      ),
    );
    return data;
  }

  /**
   * Returns all items under a specific biller.
   */
  async getBillerItems(
    requestParams: BillerItemsRequest,
  ): Promise<BillerItemsResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.BILLS_PAYMENT_BILLER_ITEMS, {
      ...requestParams,
    });
    this.logger.debug(
      `Fetching biller items for billerId: ${requestParams.billerId} using path: ${urlPath}`,
    );
    const { data } = await firstValueFrom(
      this.billsHttpService.get<BillerItemsResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'getBillerItems'),
        ),
      ),
    );
    return data;
  }

  /**
   * Validates a customerId input field (e.g., meter number) before making the bill payment.
   * Mandatory for utility, cable TV, betting, and gaming services.
   */
  async validateCustomer(
    requestParams: CustomerValidateRequest,
  ): Promise<CustomerValidateResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.BILLS_PAYMENT_CUSTOMER_VALIDATE, {
      ...requestParams,
    });
    this.logger.debug(
      `Validating customer for biller: ${requestParams.billerId} with customerId: ${requestParams.customerId} using path: ${urlPath}`,
    );
    const { data } = await firstValueFrom(
      this.billsHttpService.get<CustomerValidateResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'validateCustomer'),
        ),
      ),
    );
    return data;
  }

  /**
   * Initiates a bill payment.
   */
  async payBill(requestBody: PayBillRequest): Promise<PayBillResponse> {
    const urlPath = this.buildUrlPath(VFDUrls.BILLS_PAYMENT_PAY_BILL);
    this.logger.debug(
      `Initiating bill payment for customer: ${requestBody.customerId} on biller: ${requestBody.billerId} using path: ${urlPath}`,
    );
    const { data } = await firstValueFrom(
      this.billsHttpService.post<PayBillResponse>(urlPath, requestBody).pipe(
        // Removed headers
        catchError((error: AxiosError) => this.handleError(error, 'payBill')),
      ),
    );
    return data;
  }

  /**
   * Returns the status of a bill payment transaction.
   */
  async getBillTransactionStatus(
    requestParams: BillTransactionStatusRequest,
  ): Promise<BillTransactionStatusResponse> {
    const urlPath = this.buildUrlPath(
      VFDUrls.BILLS_PAYMENT_TRANSACTION_STATUS,
      { ...requestParams },
    );
    this.logger.debug(
      `Getting bill transaction status for transactionId: ${requestParams.transactionId} using path: ${urlPath}`,
    );
    const { data } = await firstValueFrom(
      this.billsHttpService.get<BillTransactionStatusResponse>(urlPath).pipe(
        // Removed headers
        catchError((error: AxiosError) =>
          this.handleError(error, 'getBillTransactionStatus'),
        ),
      ),
    );
    return data;
  }
}
