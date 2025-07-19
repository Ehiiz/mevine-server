import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Observable, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  CreateSubAccountPayload,
  EditSubAccountDetailsPayload,
  CreatePaymentAddressPayload,
  ReEnqueGeneratedWalletAddressPayload,
  CreateWithdrawalPayload,
  CreateInstantSwapPayload,
  TemporarySwapQuotationPayload,
  CreateBeneficiaryAccountPayload,
  EditBeneficiaryAccountPayload,

  // Import other response interfaces if you need them for return types
  SubAccount,
  Wallet,
  PaymentAddress,
  Withdrawal,
  Market,
  MarketTicker,
  KLineData,
  OrderBook,
  DepthData,
  MarketSummary,
  Trade,
  Deposit,
  SwapTransaction,
  Beneficiary,
  CryptoWithdrawalFees,
  QuidaxApiResponse,
  TemporarySwapQuotationResponse,
} from './quidax.interface'; // Import the new interfaces
import { HttpService } from '@nestjs/axios';
import { th } from '@faker-js/faker/.';
import { WinstonNestJSLogger } from 'src/core/logger/winston/winston-nestjs-logger.service';

@Injectable()
export class QuidaxService {
  // The baseUrl property is no longer needed directly in the service,
  // as it's now configured in the HttpModule itself.

  constructor(
    private readonly httpService: HttpService, // HttpService is now pre-configured with baseURL and headers
    private readonly logger: WinstonNestJSLogger,
  ) {
    // No direct baseUrl or API key check here, as HttpModule.registerAsync handles it.
    // If QUIDAX_API_KEY or QUIDAX_BASE_URL is missing, the HttpModule initialization will likely fail.
  }

  // The getHeaders() method has been removed as headers are now set globally
  // via HttpModule.registerAsync in app.module.ts.

  private async makeRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any,
  ): Promise<T> {
    try {
      this.logger.info(data);
      const request: Observable<T> = this.httpService[method](
        url, // baseURL is now implicitly handled by the HttpService instance
        data,
      ).pipe(
        map((response: AxiosResponse<QuidaxApiResponse<T>>) => {
          this.logger.log('Quidax API Response', response!.data!.data as any);
          return response.data.data;
        }),
        catchError((error) => {
          this.logger.error(
            `Quidax API Error for ${url}: ${error.response.data.message}`,
          );
          throw new HttpException(
            error.response?.data.message || 'Quidax API request failed',
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
      );
      return await firstValueFrom(request);
    } catch (error) {
      // Re-throw the HttpException or a generic error if it's not an HttpException
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Unexpected error during Quidax API request to ${url}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'An unexpected error occurred',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // --- User Accounts API ---

  /**
   * Creates a sub-account on behalf of your users.
   * @param payload The sub-account creation data.
   */
  async createSubAccount(
    payload: CreateSubAccountPayload,
  ): Promise<SubAccount> {
    this.logger.log('Creating sub-account...');
    return await this.makeRequest<SubAccount>('post', '/users', payload);
  }

  /**
   * Edits a user's sub-account information.
   * @param subAccountId The ID of the sub-account to edit.
   * @param payload The updated sub-account data.
   */
  async editSubAccountDetails(
    subAccountId: string,
    payload: EditSubAccountDetailsPayload,
  ): Promise<SubAccount> {
    this.logger.log(`Editing sub-account ${subAccountId} details...`);
    return await this.makeRequest<SubAccount>(
      'put',
      `/users/${subAccountId}`,
      payload,
    );
  }

  /**
   * Fetches all sub-accounts.
   */
  async fetchAllSubAccounts(): Promise<SubAccount[]> {
    this.logger.log('Fetching all sub-accounts...');
    return await this.makeRequest<SubAccount[]>('get', '/users');
  }

  /**
   * Fetches details of a specific sub-account.
   * @param subAccountId The ID of the sub-account to fetch.
   */
  async fetchDetailsOfSubAccount(subAccountId: string): Promise<SubAccount> {
    this.logger.log(`Fetching details of sub-account ${subAccountId}...`);
    return await this.makeRequest<SubAccount>('get', `/users/${subAccountId}`);
  }

  /**
   * Fetches the parent account details.
   */
  async fetchParentAccount(): Promise<any> {
    // Assuming no specific interface for parent account yet
    this.logger.log('Fetching parent account details...');
    return await this.makeRequest('get', '/users/me');
  }

  // --- Wallets API ---

  /**
   * Fetches all wallets for a user.
   * @param userId The ID of the user whose wallets to fetch.
   */
  async fetchUserWallets(userId: string): Promise<Wallet[]> {
    this.logger.log(`Fetching wallets for user ${userId}...`);
    return await this.makeRequest<Wallet[]>('get', `/users/${userId}/wallets`);
  }

  /**
   * Fetches a specific wallet for a user.
   * @param userId The ID of the user.
   * @param walletId The ID of the wallet.
   */
  async fetchUserWallet(userId: string, currency: string): Promise<Wallet> {
    this.logger.log(`Fetching wallet ${currency} for user ${userId}...`);
    return await this.makeRequest<Wallet>(
      'get',
      `/users/${userId}/wallets/${currency}`,
    );
  }

  /**
   * Fetches a payment address by its ID.
   * @param addressId The ID of the payment address.
   */
  async fetchPaymentAddressById(
    addressId: string,
    userId: string,
    currency: string,
  ): Promise<PaymentAddress> {
    this.logger.log(`Fetching payment address by ID ${addressId}...`);
    return await this.makeRequest<PaymentAddress>(
      'get',
      `/users/${userId}/wallets/${currency}/addresses/${addressId}`,
    );
  }

  /**
   * Fetches a payment address.
   */
  async fetchAPaymentAddresses(
    userId: string,
    currency: string,
  ): Promise<PaymentAddress> {
    this.logger.log('Fetching a payment addresses...');
    return await this.makeRequest<PaymentAddress>(
      'get',
      `/users/${userId}/wallets/${currency}/address`,
    );
  }

  /**
   * Fetches all payment addresses.
   */
  async fetchPaymentAddresses(
    userId: string,
    currency: string,
  ): Promise<PaymentAddress[]> {
    this.logger.log('Fetching all payment addresses...');
    return await this.makeRequest<PaymentAddress[]>(
      'get',
      `/users/${userId}/wallets/${currency}/addresses`,
    );
  }

  /**
   * Creates a payment address for a cryptocurrency for a given sub-account.
   * @param payload The payment address creation data (e.g., currency, sub_account_id).
   */
  async createPaymentAddressForCryptocurrency(
    userId: string,
    currency: string,
    payload: CreatePaymentAddressPayload,
  ): Promise<PaymentAddress> {
    this.logger.log('Creating payment address for cryptocurrency...');
    return await this.makeRequest<PaymentAddress>(
      'post',
      `/users/${userId}/wallets/${currency}/addresses`,
      payload,
    );
  }

  /**
   * Re-enqueues a generated wallet address.
   * @param payload The data for re-enqueuing the address.
   */
  async reEnqueGeneratedWalletAddress(
    payload: ReEnqueGeneratedWalletAddressPayload,
  ): Promise<any> {
    // Return type might be specific
    this.logger.log('Re-enqueuing generated wallet address...');
    return this.makeRequest(
      'post',
      '/users/me/wallets/addresses/re_enque',
      payload,
    );
  }

  // --- Validate Address API ---

  /**
   * Validates a cryptocurrency address.
   * @param currency The currency symbol (e.g., 'btc').
   * @param address The address to validate.
   */
  async validateAddress(currency: string, address: string): Promise<any> {
    // Return type might be specific (e.g., { is_valid: boolean })
    this.logger.log(
      `Validating address ${address} for currency ${currency}...`,
    );
    return await this.makeRequest(
      'get',
      `/${currency}/${address}/validate_address`,
    );
  }

  // --- Withdrawals API ---

  /**
   * Fetches all withdrawal details.
   */
  async fetchAllWithdrawals(
    userId: string,
    currency: string,
    state: string,
  ): Promise<Withdrawal[]> {
    this.logger.log('Fetching all withdrawals...');
    return await this.makeRequest<Withdrawal[]>(
      'get',
      `/users/${userId}/withdraws?currency=${currency}&state=${state}`,
    );
  }

  /**
   * Cancels a withdrawal.
   * @param withdrawalId The ID of the withdrawal to cancel.
   */
  async cancelWithdrawal(withdrawalId: string): Promise<any> {
    // Return type might be specific (e.g., { success: boolean })
    this.logger.log(`Cancelling withdrawal ${withdrawalId}...`);
    return await this.makeRequest(
      'post',
      `/users/me/withdraws/${withdrawalId}/cancel`,
    );
  }

  /**
   * Fetches details of a specific withdrawal.
   * @param withdrawalId The ID of the withdrawal to fetch.
   */
  async fetchAWithdrawalDetail(
    withdrawalId: string,
    userId: string,
  ): Promise<Withdrawal> {
    this.logger.log(`Fetching detail of withdrawal ${withdrawalId}...`);
    return await this.makeRequest<Withdrawal>(
      'get',
      `/users/${userId}/withdraws/${withdrawalId}`,
    );
  }

  /**
   * Creates a new withdrawal.
   * @param payload The withdrawal creation data.
   */
  async createWithdrawal(
    userId: string,
    payload: CreateWithdrawalPayload,
  ): Promise<Withdrawal> {
    this.logger.log('Creating withdrawal...');
    return await this.makeRequest<Withdrawal>(
      'post',
      `/users/${userId}/withdraws`,
      payload,
    );
  }

  /**
   * Fetches a withdrawal by its reference.
   * @param reference The reference of the withdrawal to fetch.
   */
  async fetchWithdrawByReference(
    reference: string,
    userId: string,
  ): Promise<Withdrawal> {
    this.logger.log(`Fetching withdrawal by reference ${reference}...`);
    return await this.makeRequest<Withdrawal>(
      'get',
      `/users/${userId}/withdraws/reference/${reference}`,
    );
  }

  // --- Markets API ---

  /**
   * Lists all markets.
   */
  async listAllMarkets(): Promise<Market[]> {
    this.logger.log('Listing all markets...');
    return await this.makeRequest<Market[]>('get', '/markets');
  }

  /**
   * Lists market tickers.
   */
  async listMarketTickers(): Promise<MarketTicker[]> {
    this.logger.log('Listing market tickers...');
    return await this.makeRequest<MarketTicker[]>('get', '/markets/tickers');
  }

  /**
   * Fetches a specific market ticker.
   * @param marketId The ID of the market (e.g., 'btc-ngn').
   */
  async fetchAMarketTicker(currency: string): Promise<MarketTicker> {
    this.logger.log(`Fetching market ticker for ${currency}...`);
    return await this.makeRequest<MarketTicker>(
      'get',
      `/markets/tickers/${currency}`,
    );
  }

  /**
   * Fetches k-line data for a market.
   * @param marketId The ID of the market.
   * @param payload Query parameters for k-line data (e.g., limit, period).
   */
  async fetchKLineForAMarket(marketId: string): Promise<KLineData[]> {
    this.logger.log(`Fetching k-line data for market ${marketId}...`);
    return await this.makeRequest<KLineData[]>('get', `/markets/${marketId}/k`);
  }

  /**
   * Fetches k-line data with pending trades for a market.
   * @param marketId The ID of the market.
   * @param payload Query parameters for k-line data (e.g., limit, period).
   */
  async fetchKLineDataWithPendingTradesForAMarket(
    currency: string,
    tradeId: string,
    payload?: { limit?: number; period?: number },
  ): Promise<KLineData[]> {
    this.logger.log(
      `Fetching k-line data with pending trades for market ${currency}...`,
    );
    return await this.makeRequest<KLineData[]>(
      'get',
      `/markets/${currency}/k_line_with_pending_trades/${tradeId}`,
    );
  }

  /**
   * Fetches order-book items for a market.
   * @param marketId The ID of the market.
   * @param payload Query parameters for order-book (e.g., limit).
   */
  async fetchOrderBookItemsForAMarket(
    currency: string,
    payload?: { limit?: number },
  ): Promise<OrderBook> {
    this.logger.log(`Fetching order-book items for market ${currency}...`);
    return await this.makeRequest<OrderBook>(
      'get',
      `/markets/${currency}/order_book`,
    );
  }

  /**
   * Fetches depth data for a market.
   * @param marketId The ID of the market.
   * @param payload Query parameters for depth data (e.g., limit).
   */
  async fetchDepthDataForAMarket(
    currency: string,
    payload?: { limit?: number },
  ): Promise<DepthData> {
    this.logger.log(`Fetching depth data for market ${currency}...`);
    const queryString = new URLSearchParams(payload as any).toString();
    return await this.makeRequest<DepthData>(
      'get',
      `/markets/${currency}/depth?${queryString}`,
    );
  }

  /**
   * Fetches markets summary.
   */
  async marketsSummary(): Promise<MarketSummary[]> {
    this.logger.log('Fetching markets summary...');
    return await this.makeRequest<MarketSummary[]>('get', '/markets/summary');
  }

  // --- Trades API ---

  /**
   * Fetches recent trades for a given market pair.
   * @param marketId The ID of the market (e.g., 'btc-ngn').
   * @param payload Query parameters for trades (e.g., limit).
   */
  async fetchRecentTradesForAGivenMarketPair(
    marketpair: string,
    payload?: { limit?: number },
  ): Promise<Trade[]> {
    this.logger.log(`Fetching recent trades for market ${marketpair}...`);
    return await this.makeRequest<Trade[]>('get', `/trades/${marketpair}`);
  }

  // --- Deposits API ---

  /**
   * Fetches all deposits.
   */
  async fetchAllDeposits(
    userId: string,
    payload?: { currency: string; state: string },
  ): Promise<Deposit[]> {
    this.logger.log('Fetching all deposits...');
    const queryString = new URLSearchParams(payload as any).toString();

    return await this.makeRequest<Deposit[]>(
      'get',
      `/users/${userId}/deposits?${queryString}`,
    );
  }

  /**
   * Fetches a specific deposit.
   * @param depositId The ID of the deposit to fetch.
   */
  async fetchADeposit(depositId: string, userId: string): Promise<Deposit> {
    this.logger.log(`Fetching deposit ${depositId}...`);
    return await this.makeRequest<Deposit>(
      'get',
      `/users/${userId}/deposits/${depositId}`,
    );
  }

  /**
   * Fetches deposits made by sub-users.
   */
  async fetchDepositsMadeBySubUsers(): Promise<Deposit[]> {
    this.logger.log('Fetching deposits made by sub-users...');
    return await this.makeRequest<Deposit[]>('get', '/users/deposits/all');
  }

  // --- Swap API ---

  /**
   * Creates an instant swap.
   * @param payload The instant swap creation data.
   */
  async createInstantSwap(
    userId: string,
    payload: CreateInstantSwapPayload,
  ): Promise<SwapTransaction> {
    this.logger.log('Creating instant swap...');
    return await this.makeRequest<SwapTransaction>(
      'post',
      `/users/${userId}/swap_quotation`,
      payload,
    );
  }

  /**
   * Confirms an instant swap.
   * @param swapId The ID of the swap to confirm.
   */
  async confirmInstantSwap(
    quotationId: string,
    userId: string,
  ): Promise<SwapTransaction> {
    this.logger.log(`Confirming instant swap ${quotationId}...`);
    // Assuming no request body is needed for confirm, or a minimal one
    return await this.makeRequest<SwapTransaction>(
      'post',
      `/users/${userId}/swap_quotation/$${quotationId}/confirm`,
      {},
    );
  }

  /**
   * Refreshes an instant swap quotation.
   * @param swapId The ID of the swap to refresh.
   */
  async refreshInstantSwapQuotation(
    quotationId: string,
    userId: string,
  ): Promise<SwapTransaction> {
    this.logger.log(`Refreshing instant swap quotation for ${quotationId}...`);
    // Assuming no request body is needed for refresh, or a minimal one
    return await this.makeRequest<SwapTransaction>(
      'post',
      `/users/${userId}/swap_quotation/$${quotationId}/confirm`,
      {},
    );
  }

  /**
   * Fetches a specific swap transaction.
   * @param swapId The ID of the swap transaction to fetch.
   */
  async fetchSwapTransaction(
    userId: string,
    swapId: string,
  ): Promise<SwapTransaction> {
    this.logger.log(`Fetching swap transaction ${swapId}...`);
    return await this.makeRequest<SwapTransaction>(
      'get',
      `/users/${userId}/swap_transactions/${swapId}`,
    );
  }

  /**
   * Gets all swap transactions.
   */
  async getSwapTransactions(userId: string): Promise<SwapTransaction[]> {
    this.logger.log('Getting all swap transactions...');
    return await this.makeRequest<SwapTransaction[]>(
      'get',
      `/users/${userId}/swap_transactions`,
    );
  }

  /**
   * Fetches a temporary swap quotation.
   * @param payload The temporary swap quotation data.
   */
  async temporarySwapQuotation(
    userId: string,
    payload: TemporarySwapQuotationPayload,
  ): Promise<TemporarySwapQuotationResponse> {
    // Return type is likely a quote object, not a full transaction
    this.logger.log('Fetching temporary swap quotation...');
    return await this.makeRequest<TemporarySwapQuotationResponse>(
      'post',
      `/users/${userId}/temporary_swap_quotation`,
      payload,
    );
  }

  // --- Beneficiaries API ---

  /**
   * Fetches all beneficiaries.
   */
  async fetchAllBeneficiaries(
    userId: string,
    currency: string,
  ): Promise<Beneficiary[]> {
    this.logger.log('Fetching all beneficiaries...');
    return await this.makeRequest<Beneficiary[]>(
      'get',
      `users/${userId}/beneficiaries?currency=${currency}`,
    );
  }

  /**
   * Creates a beneficiary account.
   * @param payload The beneficiary account creation data.
   */
  async createABeneficiaryAccount(
    userId: string,
    payload: CreateBeneficiaryAccountPayload,
  ): Promise<Beneficiary> {
    this.logger.log('Creating a beneficiary account...');
    return await this.makeRequest<Beneficiary>(
      'post',
      `/users/${userId}/beneficiaries`,
      payload,
    );
  }

  /**
   * Fetches a specific beneficiary account.
   * @param beneficiaryId The ID of the beneficiary account to fetch.
   */
  async fetchABeneficiaryAccount(
    beneficiaryId: string,
    userId: string,
  ): Promise<Beneficiary> {
    this.logger.log(`Fetching beneficiary account ${beneficiaryId}...`);
    return await this.makeRequest<Beneficiary>(
      'get',
      `/users/${userId}/beneficiaries/${beneficiaryId}`,
    );
  }

  /**
   * Edits a beneficiary account.
   * @param beneficiaryId The ID of the beneficiary account to edit.
   * @param payload The updated beneficiary account data.
   */
  async editABeneficiaryAccount(
    beneficiaryId: string,
    userId: string,
    payload: EditBeneficiaryAccountPayload,
  ): Promise<Beneficiary> {
    this.logger.log(`Editing beneficiary account ${beneficiaryId}...`);
    return await this.makeRequest<Beneficiary>(
      'put',
      `/users/${userId}/beneficiaries/${beneficiaryId}`,
      payload,
    );
  }

  // --- Fees API ---

  /**
   * Gets crypto withdrawal fees.
   * @param currency The currency symbol (e.g., 'btc').
   * @param amount The amount for which to calculate fees.
   */
  async getCryptoWithdrawalFees(
    currency: string,
  ): Promise<CryptoWithdrawalFees> {
    this.logger.log(`Getting crypto withdrawal fees for ${currency} amount `);
    return await this.makeRequest<CryptoWithdrawalFees>(
      'get',
      `/fee?currency=${currency}`,
    );
  }
}
