import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  CreateOrderPayload,
  CreateBeneficiaryAccountPayload,
  EditBeneficiaryAccountPayload,
  CreateInstantOrderBuyCryptoFromFiatPayload,
  CreateInstantOrderSellCryptoToFiatPayload,
  CreateInstantOrderBuyCryptoWithVolumePayload,
  InitiateOnRampTransactionPayload,
  InitiateOffRampTransactionPayload,
  BankAccountOffRampPayload,
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
  Order,
  Beneficiary,
  CryptoWithdrawalFees,
  InstantOrder,
  PaymentMethod,
  PurchaseLimit,
  PurchaseQuote,
  RampTransaction,
  BankAccount,
  QuidaxApiResponse,
} from './quidax.interface'; // Import the new interfaces
import { HttpService } from '@nestjs/axios';

@Injectable()
export class QuidaxService {
  private readonly logger = new Logger(QuidaxService.name);
  // The baseUrl property is no longer needed directly in the service,
  // as it's now configured in the HttpModule itself.

  constructor(
    private readonly httpService: HttpService, // HttpService is now pre-configured with baseURL and headers
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
      const request: Observable<T> = this.httpService[method](
        url, // baseURL is now implicitly handled by the HttpService instance
        data,
      ).pipe(
        map(
          (response: AxiosResponse<QuidaxApiResponse<T>>) => response.data.data,
        ),
        catchError((error) => {
          this.logger.error(
            `Quidax API Error for ${url}: ${error.message}`,
            error.stack,
          );
          throw new HttpException(
            error.response?.data || 'Quidax API request failed',
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
    return this.makeRequest<SubAccount>('post', '/users/sub_accounts', payload);
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
    return this.makeRequest<SubAccount>(
      'put',
      `/users/sub_accounts/${subAccountId}`,
      payload,
    );
  }

  /**
   * Fetches all sub-accounts.
   */
  async fetchAllSubAccounts(): Promise<SubAccount[]> {
    this.logger.log('Fetching all sub-accounts...');
    return this.makeRequest<SubAccount[]>('get', '/users/sub_accounts');
  }

  /**
   * Fetches details of a specific sub-account.
   * @param subAccountId The ID of the sub-account to fetch.
   */
  async fetchDetailsOfSubAccount(subAccountId: string): Promise<SubAccount> {
    this.logger.log(`Fetching details of sub-account ${subAccountId}...`);
    return this.makeRequest<SubAccount>(
      'get',
      `/users/sub_accounts/${subAccountId}`,
    );
  }

  /**
   * Fetches the parent account details.
   */
  async fetchParentAccount(): Promise<any> {
    // Assuming no specific interface for parent account yet
    this.logger.log('Fetching parent account details...');
    return this.makeRequest('get', '/users/master_account');
  }

  // --- Wallets API ---

  /**
   * Fetches all wallets for a user.
   * @param userId The ID of the user whose wallets to fetch.
   */
  async fetchUserWallets(userId: string): Promise<Wallet[]> {
    this.logger.log(`Fetching wallets for user ${userId}...`);
    return this.makeRequest<Wallet[]>('get', `/users/${userId}/wallets`);
  }

  /**
   * Fetches a specific wallet for a user.
   * @param userId The ID of the user.
   * @param walletId The ID of the wallet.
   */
  async fetchUserWallet(userId: string, walletId: string): Promise<Wallet> {
    this.logger.log(`Fetching wallet ${walletId} for user ${userId}...`);
    return this.makeRequest<Wallet>(
      'get',
      `/users/${userId}/wallets/${walletId}`,
    );
  }

  /**
   * Fetches a payment address by its ID.
   * @param addressId The ID of the payment address.
   */
  async fetchPaymentAddressById(addressId: string): Promise<PaymentAddress> {
    this.logger.log(`Fetching payment address by ID ${addressId}...`);
    return this.makeRequest<PaymentAddress>(
      'get',
      `/wallets/addresses/${addressId}`,
    );
  }

  /**
   * Fetches all payment addresses.
   */
  async fetchPaymentAddresses(): Promise<PaymentAddress[]> {
    this.logger.log('Fetching all payment addresses...');
    return this.makeRequest<PaymentAddress[]>('get', '/wallets/addresses');
  }

  /**
   * Creates a payment address for a cryptocurrency for a given sub-account.
   * @param payload The payment address creation data (e.g., currency, sub_account_id).
   */
  async createPaymentAddressForCryptocurrency(
    payload: CreatePaymentAddressPayload,
  ): Promise<PaymentAddress> {
    this.logger.log('Creating payment address for cryptocurrency...');
    return this.makeRequest<PaymentAddress>(
      'post',
      '/wallets/addresses',
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
    return this.makeRequest('post', '/wallets/addresses/re_enque', payload);
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
    return this.makeRequest(
      'get',
      `/wallets/addresses/validate?currency=${currency}&address=${address}`,
    );
  }

  // --- Withdrawals API ---

  /**
   * Fetches all withdrawal details.
   */
  async fetchAllWithdrawals(): Promise<Withdrawal[]> {
    this.logger.log('Fetching all withdrawals...');
    return this.makeRequest<Withdrawal[]>('get', '/withdrawals');
  }

  /**
   * Cancels a withdrawal.
   * @param withdrawalId The ID of the withdrawal to cancel.
   */
  async cancelWithdrawal(withdrawalId: string): Promise<any> {
    // Return type might be specific (e.g., { success: boolean })
    this.logger.log(`Cancelling withdrawal ${withdrawalId}...`);
    return this.makeRequest('post', `/withdrawals/${withdrawalId}/cancel`);
  }

  /**
   * Fetches details of a specific withdrawal.
   * @param withdrawalId The ID of the withdrawal to fetch.
   */
  async fetchAWithdrawalDetail(withdrawalId: string): Promise<Withdrawal> {
    this.logger.log(`Fetching detail of withdrawal ${withdrawalId}...`);
    return this.makeRequest<Withdrawal>('get', `/withdrawals/${withdrawalId}`);
  }

  /**
   * Creates a new withdrawal.
   * @param payload The withdrawal creation data.
   */
  async createWithdrawal(
    payload: CreateWithdrawalPayload,
  ): Promise<Withdrawal> {
    this.logger.log('Creating withdrawal...');
    return this.makeRequest<Withdrawal>('post', '/withdrawals', payload);
  }

  /**
   * Fetches a withdrawal by its reference.
   * @param reference The reference of the withdrawal to fetch.
   */
  async fetchWithdrawByReference(reference: string): Promise<Withdrawal> {
    this.logger.log(`Fetching withdrawal by reference ${reference}...`);
    return this.makeRequest<Withdrawal>(
      'get',
      `/withdrawals/reference/${reference}`,
    );
  }

  // --- Markets API ---

  /**
   * Lists all markets.
   */
  async listAllMarkets(): Promise<Market[]> {
    this.logger.log('Listing all markets...');
    return this.makeRequest<Market[]>('get', '/markets');
  }

  /**
   * Lists market tickers.
   */
  async listMarketTickers(): Promise<MarketTicker[]> {
    this.logger.log('Listing market tickers...');
    return this.makeRequest<MarketTicker[]>('get', '/markets/tickers');
  }

  /**
   * Fetches a specific market ticker.
   * @param marketId The ID of the market (e.g., 'btc-ngn').
   */
  async fetchAMarketTicker(marketId: string): Promise<MarketTicker> {
    this.logger.log(`Fetching market ticker for ${marketId}...`);
    return this.makeRequest<MarketTicker>('get', `/markets/${marketId}/ticker`);
  }

  /**
   * Fetches k-line data for a market.
   * @param marketId The ID of the market.
   * @param payload Query parameters for k-line data (e.g., limit, period).
   */
  async fetchKLineForAMarket(
    marketId: string,
    payload?: { limit?: number; period?: number },
  ): Promise<KLineData[]> {
    this.logger.log(`Fetching k-line data for market ${marketId}...`);
    const queryString = new URLSearchParams(payload as any).toString();
    return this.makeRequest<KLineData[]>(
      'get',
      `/markets/${marketId}/k_line?${queryString}`,
    );
  }

  /**
   * Fetches k-line data with pending trades for a market.
   * @param marketId The ID of the market.
   * @param payload Query parameters for k-line data (e.g., limit, period).
   */
  async fetchKLineDataWithPendingTradesForAMarket(
    marketId: string,
    payload?: { limit?: number; period?: number },
  ): Promise<KLineData[]> {
    this.logger.log(
      `Fetching k-line data with pending trades for market ${marketId}...`,
    );
    const queryString = new URLSearchParams(payload as any).toString();
    return this.makeRequest<KLineData[]>(
      'get',
      `/markets/${marketId}/k_line_with_pending_trades?${queryString}`,
    );
  }

  /**
   * Fetches order-book items for a market.
   * @param marketId The ID of the market.
   * @param payload Query parameters for order-book (e.g., limit).
   */
  async fetchOrderBookItemsForAMarket(
    marketId: string,
    payload?: { limit?: number },
  ): Promise<OrderBook> {
    this.logger.log(`Fetching order-book items for market ${marketId}...`);
    const queryString = new URLSearchParams(payload as any).toString();
    return this.makeRequest<OrderBook>(
      'get',
      `/markets/${marketId}/order_book?${queryString}`,
    );
  }

  /**
   * Fetches depth data for a market.
   * @param marketId The ID of the market.
   * @param payload Query parameters for depth data (e.g., limit).
   */
  async fetchDepthDataForAMarket(
    marketId: string,
    payload?: { limit?: number },
  ): Promise<DepthData> {
    this.logger.log(`Fetching depth data for market ${marketId}...`);
    const queryString = new URLSearchParams(payload as any).toString();
    return this.makeRequest<DepthData>(
      'get',
      `/markets/${marketId}/depth?${queryString}`,
    );
  }

  /**
   * Fetches markets summary.
   */
  async marketsSummary(): Promise<MarketSummary[]> {
    this.logger.log('Fetching markets summary...');
    return this.makeRequest<MarketSummary[]>('get', '/markets/summary');
  }

  // --- Trades API ---

  /**
   * Fetches recent trades for a given market pair.
   * @param marketId The ID of the market (e.g., 'btc-ngn').
   * @param payload Query parameters for trades (e.g., limit).
   */
  async fetchRecentTradesForAGivenMarketPair(
    marketId: string,
    payload?: { limit?: number },
  ): Promise<Trade[]> {
    this.logger.log(`Fetching recent trades for market ${marketId}...`);
    const queryString = new URLSearchParams(payload as any).toString();
    return this.makeRequest<Trade[]>(
      'get',
      `/markets/${marketId}/trades?${queryString}`,
    );
  }

  // --- Deposits API ---

  /**
   * Fetches all deposits.
   */
  async fetchAllDeposits(): Promise<Deposit[]> {
    this.logger.log('Fetching all deposits...');
    return this.makeRequest<Deposit[]>('get', '/deposits');
  }

  /**
   * Fetches a specific deposit.
   * @param depositId The ID of the deposit to fetch.
   */
  async fetchADeposit(depositId: string): Promise<Deposit> {
    this.logger.log(`Fetching deposit ${depositId}...`);
    return this.makeRequest<Deposit>('get', `/deposits/${depositId}`);
  }

  /**
   * Fetches deposits made by sub-users.
   */
  async fetchDepositsMadeBySubUsers(): Promise<Deposit[]> {
    this.logger.log('Fetching deposits made by sub-users...');
    return this.makeRequest<Deposit[]>('get', '/deposits/sub_users');
  }

  // --- Swap API ---

  /**
   * Creates an instant swap.
   * @param payload The instant swap creation data.
   */
  async createInstantSwap(
    payload: CreateInstantSwapPayload,
  ): Promise<SwapTransaction> {
    this.logger.log('Creating instant swap...');
    return this.makeRequest<SwapTransaction>('post', '/swaps', payload);
  }

  /**
   * Confirms an instant swap.
   * @param swapId The ID of the swap to confirm.
   */
  async confirmInstantSwap(swapId: string): Promise<SwapTransaction> {
    this.logger.log(`Confirming instant swap ${swapId}...`);
    // Assuming no request body is needed for confirm, or a minimal one
    return this.makeRequest<SwapTransaction>(
      'post',
      `/swaps/${swapId}/confirm`,
      {},
    );
  }

  /**
   * Refreshes an instant swap quotation.
   * @param swapId The ID of the swap to refresh.
   */
  async refreshInstantSwapQuotation(swapId: string): Promise<SwapTransaction> {
    this.logger.log(`Refreshing instant swap quotation for ${swapId}...`);
    // Assuming no request body is needed for refresh, or a minimal one
    return this.makeRequest<SwapTransaction>(
      'post',
      `/swaps/${swapId}/refresh`,
      {},
    );
  }

  /**
   * Fetches a specific swap transaction.
   * @param swapId The ID of the swap transaction to fetch.
   */
  async fetchSwapTransaction(swapId: string): Promise<SwapTransaction> {
    this.logger.log(`Fetching swap transaction ${swapId}...`);
    return this.makeRequest<SwapTransaction>('get', `/swaps/${swapId}`);
  }

  /**
   * Gets all swap transactions.
   */
  async getSwapTransactions(): Promise<SwapTransaction[]> {
    this.logger.log('Getting all swap transactions...');
    return this.makeRequest<SwapTransaction[]>('get', '/swaps');
  }

  /**
   * Fetches a temporary swap quotation.
   * @param payload The temporary swap quotation data.
   */
  async temporarySwapQuotation(
    payload: TemporarySwapQuotationPayload,
  ): Promise<SwapTransaction> {
    // Return type is likely a quote object, not a full transaction
    this.logger.log('Fetching temporary swap quotation...');
    return this.makeRequest<SwapTransaction>(
      'post',
      '/swaps/quotation',
      payload,
    );
  }

  // --- Order API ---

  /**
   * Creates a sell or buy order.
   * @param payload The order creation data.
   */
  async createASellOrBuyOrder(payload: CreateOrderPayload): Promise<Order> {
    this.logger.log('Creating a sell or buy order...');
    return this.makeRequest<Order>('post', '/orders', payload);
  }

  /**
   * Gets all orders.
   */
  async getAllOrders(): Promise<Order[]> {
    this.logger.log('Getting all orders...');
    return this.makeRequest<Order[]>('get', '/orders');
  }

  /**
   * Gets details of a specific order.
   * @param orderId The ID of the order to fetch.
   */
  async getAnOrderDetails(orderId: string): Promise<Order> {
    this.logger.log(`Getting details of order ${orderId}...`);
    return this.makeRequest<Order>('get', `/orders/${orderId}`);
  }

  /**
   * Cancels an order.
   * @param orderId The ID of the order to cancel.
   */
  async cancelAnOrder(orderId: string): Promise<any> {
    // Return type might be specific
    this.logger.log(`Cancelling order ${orderId}...`);
    return this.makeRequest('post', `/orders/${orderId}/cancel`);
  }

  // --- Beneficiaries API ---

  /**
   * Fetches all beneficiaries.
   */
  async fetchAllBeneficiaries(): Promise<Beneficiary[]> {
    this.logger.log('Fetching all beneficiaries...');
    return this.makeRequest<Beneficiary[]>('get', '/beneficiaries');
  }

  /**
   * Creates a beneficiary account.
   * @param payload The beneficiary account creation data.
   */
  async createABeneficiaryAccount(
    payload: CreateBeneficiaryAccountPayload,
  ): Promise<Beneficiary> {
    this.logger.log('Creating a beneficiary account...');
    return this.makeRequest<Beneficiary>('post', '/beneficiaries', payload);
  }

  /**
   * Fetches a specific beneficiary account.
   * @param beneficiaryId The ID of the beneficiary account to fetch.
   */
  async fetchABeneficiaryAccount(beneficiaryId: string): Promise<Beneficiary> {
    this.logger.log(`Fetching beneficiary account ${beneficiaryId}...`);
    return this.makeRequest<Beneficiary>(
      'get',
      `/beneficiaries/${beneficiaryId}`,
    );
  }

  /**
   * Edits a beneficiary account.
   * @param beneficiaryId The ID of the beneficiary account to edit.
   * @param payload The updated beneficiary account data.
   */
  async editABeneficiaryAccount(
    beneficiaryId: string,
    payload: EditBeneficiaryAccountPayload,
  ): Promise<Beneficiary> {
    this.logger.log(`Editing beneficiary account ${beneficiaryId}...`);
    return this.makeRequest<Beneficiary>(
      'put',
      `/beneficiaries/${beneficiaryId}`,
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
    amount: number,
  ): Promise<CryptoWithdrawalFees> {
    this.logger.log(
      `Getting crypto withdrawal fees for ${currency} amount ${amount}...`,
    );
    return this.makeRequest<CryptoWithdrawalFees>(
      'get',
      `/fees/crypto_withdrawal?currency=${currency}&amount=${amount}`,
    );
  }

  // --- Instant Orders API ---

  /**
   * Fetches all instant orders.
   */
  async fetchAllInstantOrders(): Promise<InstantOrder[]> {
    this.logger.log('Fetching all instant orders...');
    return this.makeRequest<InstantOrder[]>('get', '/instant_orders');
  }

  /**
   * Fetches instant orders created by sub-users.
   */
  async fetchInstantOrdersCreatedBySubUsers(): Promise<InstantOrder[]> {
    this.logger.log('Fetching instant orders created by sub-users...');
    return this.makeRequest<InstantOrder[]>('get', '/instant_orders/sub_users');
  }

  /**
   * Fetches detail of an instant order.
   * @param instantOrderId The ID of the instant order to fetch.
   */
  async fetchDetailOfAnInstantOrder(
    instantOrderId: string,
  ): Promise<InstantOrder> {
    this.logger.log(`Fetching detail of instant order ${instantOrderId}...`);
    return this.makeRequest<InstantOrder>(
      'get',
      `/instant_orders/${instantOrderId}`,
    );
  }

  /**
   * Creates an Instant Order (buy crypto from fiat).
   * @param payload The instant order creation data.
   */
  async createInstantOrderBuyCryptoFromFiat(
    payload: CreateInstantOrderBuyCryptoFromFiatPayload,
  ): Promise<InstantOrder> {
    this.logger.log('Creating instant order (buy crypto from fiat)...');
    return this.makeRequest<InstantOrder>(
      'post',
      '/instant_orders/buy',
      payload,
    );
  }

  /**
   * Creates an Instant Order (sell crypto to fiat).
   * @param payload The instant order creation data.
   */
  async createInstantOrderSellCryptoToFiat(
    payload: CreateInstantOrderSellCryptoToFiatPayload,
  ): Promise<InstantOrder> {
    this.logger.log('Creating instant order (sell crypto to fiat)...');
    return this.makeRequest<InstantOrder>(
      'post',
      '/instant_orders/sell',
      payload,
    );
  }

  /**
   * Creates an Instant Order (buy a fixed number of the asset, regardless of the price).
   * @param payload The instant order creation data.
   */
  async createInstantOrderBuyCryptoWithVolume(
    payload: CreateInstantOrderBuyCryptoWithVolumePayload,
  ): Promise<InstantOrder> {
    this.logger.log('Creating instant order (buy crypto with volume)...');
    return this.makeRequest<InstantOrder>(
      'post',
      '/instant_orders/buy_with_volume',
      payload,
    );
  }

  /**
   * Confirms an instant order.
   * @param instantOrderId The ID of the instant order to confirm.
   */
  async confirmAnInstantOrder(instantOrderId: string): Promise<InstantOrder> {
    this.logger.log(`Confirming instant order ${instantOrderId}...`);
    // Assuming no request body is needed for confirm, or a minimal one
    return this.makeRequest<InstantOrder>(
      'post',
      `/instant_orders/${instantOrderId}/confirm`,
      {},
    );
  }

  /**
   * Requotes an instant order.
   * @param instantOrderId The ID of the instant order to requote.
   */
  async requoteAnInstantOrder(instantOrderId: string): Promise<InstantOrder> {
    this.logger.log(`Requoting instant order ${instantOrderId}...`);
    // Assuming no request body is needed for requote, or a minimal one
    return this.makeRequest<InstantOrder>(
      'post',
      `/instant_orders/${instantOrderId}/requote`,
      {},
    );
  }

  // --- RAMP API ---

  /**
   * Fetches an off-ramp transaction.
   * @param transactionId The ID of the off-ramp transaction.
   */
  async fetchOffRampTransaction(
    transactionId: string,
  ): Promise<RampTransaction> {
    this.logger.log(`Fetching off-ramp transaction ${transactionId}...`);
    return this.makeRequest<RampTransaction>(
      'get',
      `/ramp/off_ramp/${transactionId}`,
    );
  }

  /**
   * Fetches an on-ramp transaction.
   * @param transactionId The ID of the on-ramp transaction.
   */
  async fetchOnRampTransaction(
    transactionId: string,
  ): Promise<RampTransaction> {
    this.logger.log(`Fetching on-ramp transaction ${transactionId}...`);
    return this.makeRequest<RampTransaction>(
      'get',
      `/ramp/on_ramp/${transactionId}`,
    );
  }

  /**
   * Fetches available payment methods for RAMP.
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    this.logger.log('Fetching RAMP payment methods...');
    return this.makeRequest<PaymentMethod[]>('get', '/ramp/payment_methods');
  }

  /**
   * Fetches purchase limits for buying (fiat to crypto).
   * @param payload Query parameters for purchase limits.
   */
  async getPurchaseLimitsBuy(payload?: {
    currency?: string;
    payment_method_id?: string;
  }): Promise<PurchaseLimit[]> {
    this.logger.log('Fetching purchase limits (BUY)...');
    const queryString = new URLSearchParams(payload as any).toString();
    return this.makeRequest<PurchaseLimit[]>(
      'get',
      `/ramp/purchase_limits/buy?${queryString}`,
    );
  }

  /**
   * Fetches purchase limits for selling (crypto to fiat).
   * @param payload Query parameters for purchase limits.
   */
  async getPurchaseLimitsSell(payload?: {
    currency?: string;
    payment_method_id?: string;
  }): Promise<PurchaseLimit[]> {
    this.logger.log('Fetching purchase limits (SELL)...');
    const queryString = new URLSearchParams(payload as any).toString();
    return this.makeRequest<PurchaseLimit[]>(
      'get',
      `/ramp/purchase_limits/sell?${queryString}`,
    );
  }

  /**
   * Fetches purchase quotes for buying (fiat to crypto).
   * @param payload Query parameters for purchase quotes.
   */
  async getPurchaseQuotesBuy(payload?: {
    from_currency: string;
    to_currency: string;
    amount: string;
  }): Promise<PurchaseQuote> {
    this.logger.log('Fetching purchase quotes (BUY)...');
    const queryString = new URLSearchParams(payload as any).toString();
    return this.makeRequest<PurchaseQuote>(
      'get',
      `/ramp/purchase_quotes/buy?${queryString}`,
    );
  }

  /**
   * Fetches purchase quotes for selling (crypto to fiat).
   * @param payload Query parameters for purchase quotes.
   */
  async getPurchaseQuotesSell(payload?: {
    from_currency: string;
    to_currency: string;
    amount: string;
  }): Promise<PurchaseQuote> {
    this.logger.log('Fetching purchase quotes (SELL)...');
    const queryString = new URLSearchParams(payload as any).toString();
    return this.makeRequest<PurchaseQuote>(
      'get',
      `/ramp/purchase_quotes/sell?${queryString}`,
    );
  }

  // --- CUSTODIAL API ---

  /**
   * Initiates an on-ramp transaction (fiat to crypto).
   * @param payload The on-ramp transaction initiation data.
   */
  async initiateOnRampTransaction(
    payload: InitiateOnRampTransactionPayload,
  ): Promise<RampTransaction> {
    this.logger.log('Initiating on-ramp transaction...');
    return this.makeRequest<RampTransaction>(
      'post',
      '/custodial/on_ramp',
      payload,
    );
  }

  /**
   * Refreshes an on-ramp transaction.
   * @param transactionId The ID of the on-ramp transaction to refresh.
   * @param payload The refresh data.
   */
  async refreshOnRampTransaction(
    transactionId: string,
    payload: any,
  ): Promise<RampTransaction> {
    // Payload might be specific
    this.logger.log(`Refreshing on-ramp transaction ${transactionId}...`);
    return this.makeRequest<RampTransaction>(
      'put',
      `/custodial/on_ramp/${transactionId}`,
      payload,
    );
  }

  /**
   * Confirms an on-ramp transaction.
   * @param transactionId The ID of the on-ramp transaction to confirm.
   */
  async confirmOnRampTransaction(
    transactionId: string,
  ): Promise<RampTransaction> {
    this.logger.log(`Confirming on-ramp transaction ${transactionId}...`);
    return this.makeRequest<RampTransaction>(
      'post',
      `/custodial/on_ramp/${transactionId}/confirm`,
      {},
    );
  }

  /**
   * Initiates an off-ramp transaction (crypto to fiat).
   * @param payload The off-ramp transaction initiation data.
   */
  async initiateOffRampTransaction(
    payload: InitiateOffRampTransactionPayload,
  ): Promise<RampTransaction> {
    this.logger.log('Initiating off-ramp transaction...');
    return this.makeRequest<RampTransaction>(
      'post',
      '/custodial/off_ramp',
      payload,
    );
  }

  /**
   * Refreshes an off-ramp transaction.
   * @param transactionId The ID of the off-ramp transaction to refresh.
   * @param payload The refresh data.
   */
  async refreshOffRampTransaction(
    transactionId: string,
    payload: any,
  ): Promise<RampTransaction> {
    // Payload might be specific
    this.logger.log(`Refreshing off-ramp transaction ${transactionId}...`);
    return this.makeRequest<RampTransaction>(
      'put',
      `/custodial/off_ramp/${transactionId}`,
      payload,
    );
  }

  /**
   * Confirms an off-ramp transaction.
   * @param transactionId The ID of the off-ramp transaction to confirm.
   */
  async confirmOffRampTransaction(
    transactionId: string,
  ): Promise<RampTransaction> {
    this.logger.log(`Confirming off-ramp transaction ${transactionId}...`);
    return this.makeRequest<RampTransaction>(
      'post',
      `/custodial/off_ramp/${transactionId}/confirm`,
      {},
    );
  }

  /**
   * Fetches available banks for off-ramp transactions.
   */
  async getBanksOffRamp(): Promise<BankAccount[]> {
    this.logger.log('Fetching banks for off-ramp...');
    return this.makeRequest<BankAccount[]>('get', '/custodial/banks/off_ramp');
  }

  /**
   * Adds a bank account for off-ramp transactions.
   * @param payload The bank account details to add.
   */
  async addBankAccountOffRamp(
    payload: BankAccountOffRampPayload,
  ): Promise<BankAccount> {
    this.logger.log('Adding bank account for off-ramp...');
    return this.makeRequest<BankAccount>(
      'post',
      '/custodial/banks/off_ramp',
      payload,
    );
  }
}
