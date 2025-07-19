import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';

import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Job } from 'bullmq';
import { DatabaseService } from 'src/core/database/database.service'; // Adjust path
import { sha512 } from 'js-sha512';
import {
  CreateSubAccountPayload,
  CreateWithdrawalPayload,
  CryptoWithdrawalFees,
  DepositCompletedData,
  FeeRange,
  WalletGeneratedData,
  WithdrawalCompletedData,
} from '../quidax.interface';
import { QuidaxService } from '../quidax.service';
import {
  BaseQuidaxEvent,
  CreateSubAccountQuidaxEvent,
  CreateUserCreditQuidaxEvent,
  CreateWithdrawalQuidaxEvent,
  QuidaxEventsEnum,
  UpdateUserWalletQuidaxEvent,
} from './quidax.utils';
import { BlockchainEnum } from 'src/core/interfaces/user.interface';
import { de, th } from '@faker-js/faker/.';
import { VfdProducerService } from 'src/modules/providers/bank/vfd/processor/vfd-producer.service';
import { TransferRequest } from 'src/modules/providers/bank/vfd/vfd.interface';
import { ConfigService } from '@nestjs/config';
import { VFDService } from 'src/modules/providers/bank/vfd/vfd.service';
import {
  ServiceTypeEnum,
  TransactionEntityTypeEnum,
  TransactionStatusEnum,
  TransactionTypeEnum,
} from 'src/core/interfaces/transaction.interface';
import { UserDocument } from 'src/core/database/schemas/user.schema';
import { TransactionDocument } from 'src/core/database/schemas/transaction.schema';
import mongoose from 'mongoose';
import {
  CryptoSettlementStatusEnum,
  ITransferKey,
} from 'src/core/interfaces/shared.interface';
import { InitiateTransferEvent } from 'src/modules/providers/bank/vfd/processor/vfd.utils';
import {
  CryptoFeesResponseDto,
  QuidaxRawFeeData,
} from 'src/modules/user/transfer/transfer.validator';
import { WinstonNestJSLogger } from 'src/core/logger/winston/winston-nestjs-logger.service';

const IN_HOUSE_FEES: { [key: string]: number } = {
  btc: 0.00005, // e.g., 5,000 satoshis
  eth: 0.0002,
  sol: 0.001,
  usdt: 0.5,
  trx: 0.2,
};

const ABSOLUTE_MIN_DEPOSIT_CRYPTO: { [key: string]: number } = {
  btc: 0.0002, // e.g., 20,000 satoshis (a reasonable small deposit)
  eth: 0.01,
  sol: 0.1,
  usdt: 10,
  trx: 20,
};

const MEVINE_FEE_PERCENTAGE = 0.1; // 10% additional fee

@Injectable()
@Processor('quidax-process') // This processor will handle jobs from 'product-stats' queue
export class QuidaxConsumerService extends WorkerHost {
  private readonly platformBVN: string;
  private readonly platformClientId: string;
  private readonly platformClient: string;
  private readonly platformAccountId: string;
  private readonly platformAccountNumber: string;
  private readonly platformQuidaxId: string;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly quidaxService: QuidaxService,
    private readonly vfdProducerService: VfdProducerService,
    private readonly bankService: VFDService,
    private readonly configService: ConfigService,
    private readonly logger: WinstonNestJSLogger,
  ) {
    super();

    // Initialize config values
    this.platformBVN = this.configService.get<string>('PLATFORM_BVN') || '';
    this.platformClientId =
      this.configService.get<string>('PLATFORM_CLIENT_ID') || '';
    this.platformClient =
      this.configService.get<string>('PLATFORM_CLIENT') || '';
    this.platformAccountId =
      this.configService.get<string>('PLATFORM_ACCOUNT_ID') || '';
    this.platformAccountNumber =
      this.configService.get<string>('PLATFORM_ACCOUNT_NUMBER') || '';
    this.platformQuidaxId =
      this.configService.get<string>('PLATFORM_QUIDAX_ID') || '';
    this.logger.setContext(QuidaxConsumerService.name);
    // Log initialization for debugging
    this.logger.log('QuidaxConsumerService initialized with platform config');
  }

  async process(job: Job<BaseQuidaxEvent, any, string>): Promise<any> {
    const event = job.data as unknown as BaseQuidaxEvent;

    switch (event.requestName) {
      case QuidaxEventsEnum.CREATE_SUB_ACCOUNT:
        const formattedEvent = event as unknown as CreateSubAccountQuidaxEvent;

        await this.processSubAccountCreation(formattedEvent.data);
        this.logger.log(`Processing job: ${job.name}`);
        break;

      case QuidaxEventsEnum.UPDATE_USER_WALLET:
        const userWalletEvent = event as unknown as UpdateUserWalletQuidaxEvent;
        await this.processPaymentWalletGeneration(userWalletEvent.data);
        break;

      case QuidaxEventsEnum.DEPOSIT_COMPLETED:
        const depositEvent = event as unknown as CreateWithdrawalQuidaxEvent;
        await this.processDeposit(depositEvent.data);
        break;

      case QuidaxEventsEnum.INITIATE_TRANSFER:
        const withdrawalEvent = event as unknown as CreateUserCreditQuidaxEvent;
        await this.processWalletTransfer(withdrawalEvent.data);
        break;
    }

    this.logger.log(`Processing function for ${event.requestName}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<BaseQuidaxEvent, any, string>) {
    this.logger.log(`Quidax request completed for ${job.name}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<BaseQuidaxEvent, any, string>, error: Error) {
    this.logger.error(
      `Failed quidax api job: ${job.name} for ${(job.data as unknown as any).event.email}`,
      error.stack,
    );
  }

  @OnWorkerEvent('stalled')
  onStalled(job: Job<BaseQuidaxEvent, any, string>) {
    this.logger.warn(
      `Stalled quidax api job: ${job.name} - Event: ${(job.data as unknown as any).event.email}`,
    );
  }

  private async processSubAccountCreation(body: CreateSubAccountPayload) {
    try {
      const { id: quidaxId } = await this.quidaxService.createSubAccount(body);
      this.logger.log(
        `New user : ${body.email} successfully created subaccount with id : ${quidaxId}`,
      );
      const user = await this.databaseService.users.findOne({
        email: body.email,
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
      user.quidaxId = quidaxId;

      await user.save();

      const supportedCurrencies = ['usdt', 'trx', 'btc', 'eth', 'sol'];

      // Create all cryptocurrency wallets concurrently
      const walletPromises = supportedCurrencies.map((currency) =>
        this.quidaxService.createPaymentAddressForCryptocurrency(
          quidaxId,
          currency,
          {
            user_id: quidaxId,
            currency,
          },
        ),
      );

      await Promise.all(walletPromises);
      this.logger.log('Successfully sent wallet creation requests');
      return;
    } catch (error) {
      this.logger.fatal(error);
    }
  }

  private async processPaymentWalletGeneration(
    addressData: WalletGeneratedData,
  ) {
    this.logger.log('I ran into here');
    this.logger.log(
      `The address ${addressData.currency} : ${addressData.address} successfully generated for ${addressData.user.email} `,
    );

    const currency = addressData.currency.toLowerCase() as BlockchainEnum; // Ensure lowercase and cast to enum

    // Validate if the currency is a known blockchain
    if (!Object.values(BlockchainEnum).includes(currency)) {
      this.logger.log(
        `Received unknown currency '${currency}' from webhook. Cannot update crypto address.`,
      );
      return;
    }

    const user = await this.databaseService.users.findOne({
      quidax: addressData.user.id,
    });

    if (!user) {
      this.logger.log('User not found');
      return;
    }

    const existingCryptoDetails = user.cryptoAddresses.get(currency);

    if (existingCryptoDetails && existingCryptoDetails.set) {
      this.logger.log(
        `Address for ${currency} is already set for user ${user.email}. Skipping update.`,
      );
      return;
    }

    user.cryptoAddresses.set(currency, {
      address: addressData.address,
      set: true,
    });

    user.markModified('cryptoAddresses');

    await user.save();

    this.logger.log(
      `Handling withdrawal.address.generated event for ID: ${addressData.address}`,
    );

    return { message: 'Withdrawal address generated event processed.' };
  }

  private async processDeposit(depositData: DepositCompletedData) {
    this.logger.log(
      `Handling deposit.completed event for ID: ${depositData.id}`,
    );
    if (depositData.status === 'accepted') {
      this.logger.log(
        `Deposit completed for user ${depositData!.user!.id} with amount ${depositData.amount} ${depositData.currency}`,
      );

      const withdrawalPayload: CreateWithdrawalPayload = {
        currency: depositData.currency,
        amount: depositData!.amount,
        transaction_note: `Deposit completed for user ${depositData.user.id}`,
        narration: `Automated withdrawal for deposit ${depositData.id}`,
        fund_uid: this.platformQuidaxId, // Pass if withdrawal API requires it
        reference: `MEV-DEPOSIT-${new Date().toISOString()}`,
      };

      const user = await this.databaseService.users.findOne({
        quidaxId: depositData.user!.id,
      });

      if (!user) {
        this.logger.log(`User ${depositData.user.id} not found`);
        //add notifications or push money to main account
      }

      // Ensure the amount is a string as per Quidax API requirements
      if (typeof withdrawalPayload.amount === 'number') {
        withdrawalPayload.amount =
          withdrawalPayload.amount as unknown as string;
      }

      try {
        await this.databaseService.cryptoFundTransactions.create({
          senderId: depositData.user!.id,
          senderWalletAddress: depositData.wallet.deposit_address,
          destinationWalletAddress: this.platformQuidaxId,
          currency: withdrawalPayload.currency,
          amount: withdrawalPayload.amount,
          reference: withdrawalPayload.reference,
        });

        const withdrawalResult = await this.quidaxService.createWithdrawal(
          depositData.user.id!,
          withdrawalPayload,
        );
        this.logger.info(
          'Automated withdrawal initiated successfully:',
          withdrawalResult,
        );
        return {
          message: 'Deposit completed and automated withdrawal initiated',
          withdrawal: withdrawalResult,
        };
      } catch (withdrawalError) {
        this.logger.error(
          `Failed to initiate automated withdrawal for deposit ${depositData.id}: ${withdrawalError.message}`,
          withdrawalError.stack,
        );
        throw new HttpException(
          withdrawalError.response?.data || 'Failed to initiate withdrawal',
          withdrawalError.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      this.logger.log(
        `Deposit event ${depositData.id} is not 'completed'. Status: ${depositData.status}`,
      );
    }
  }

  private async processWalletTransfer(depositData: WithdrawalCompletedData) {
    // Changed type to DepositCompletedData
    const session = await this.databaseService.transactions.startSession();
    session.startTransaction(); // Start a transaction

    this.logger.log(
      `Attempting to process wallet transfer (deposit to fiat) for ID: ${depositData.id}`,
    );

    // Only proceed if the deposit is in a 'completed' or 'accepted' state
    if (depositData.status.toLowerCase() !== 'done') {
      this.logger.log(
        `Deposit event ${depositData.id} is not 'completed' or 'accepted'. Status: ${depositData.status}. Skipping transfer.`,
      );
      await session.endSession();
      return;
    }

    const cryptoFund =
      await this.databaseService.cryptoFundTransactions.findOne({
        reference: depositData.reference,
      });

    if (!cryptoFund) {
      this.logger.error(
        `Transaction: ${depositData.reference} not found for transfer. Aborting transaction.`,
      );
      await session.endSession();
      return;
    }

    cryptoFund.settlementStatus = CryptoSettlementStatusEnum.SETTLED;
    await cryptoFund.save({ session });

    const user = await this.databaseService.users.findOne({
      quidaxId: depositData.user?.id,
    });

    if (!user) {
      this.logger.error(
        `User: ${depositData.user?.id} not found for transfer. Aborting transaction.`,
      );
      await session.endSession();
      return;
    }

    // Ensure user has bank details for transfer
    if (!user.bankDetails?.accountNumber || !user.bankDetails?.bankCode) {
      this.logger.error(
        `User ${user.email} does not have complete bank details for transfer. Aborting transaction.`,
      );
      await session.endSession();
      return;
    }

    try {
      const { data: recipientDetails } =
        await this.bankService.verifyBankDetails({
          accountNo: user.bankDetails.accountNumber,
          bank: user.bankDetails.bankCode, // Use user's bankCode
          transfer_type: 'intra', // Assuming intra-bank transfer
        });

      if (!recipientDetails) {
        this.logger.error(
          `Bank details verification failed for user ${user.email}. Aborting transaction.`,
        );
        throw new HttpException(
          'Bank details verification failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      const { signature, reference } =
        this.createTransferSignatureWithReference({
          receiverAccount: user.bankDetails.accountNumber,
          senderAccount: this.platformAccountNumber,
        });

      const lowerCaseCurrency = depositData.currency?.toLowerCase();

      // Input validation for currency and amount
      if (
        !lowerCaseCurrency ||
        !Object.values(BlockchainEnum).includes(
          lowerCaseCurrency as BlockchainEnum,
        )
      ) {
        this.logger.error(
          `Invalid or missing currency in deposit data: ${depositData.currency}. Aborting transaction.`,
        );
        throw new HttpException(
          'Invalid cryptocurrency for transfer',
          HttpStatus.BAD_REQUEST,
        );
      }
      const depositedCryptoAmount = parseFloat(depositData.amount || '0');
      if (isNaN(depositedCryptoAmount) || depositedCryptoAmount <= 0) {
        this.logger.error(
          `Invalid or missing deposit amount: ${depositData.amount}. Aborting transaction.`,
        );
        throw new HttpException(
          'Invalid deposit amount for transfer',
          HttpStatus.BAD_REQUEST,
        );
      }

      // 1. Fetch raw network fee data from Quidax
      const quidaxFeeData: QuidaxRawFeeData =
        await this.quidaxService.getCryptoWithdrawalFees(lowerCaseCurrency);

      if (!quidaxFeeData) {
        this.logger.error(
          `Crypto fees for ${lowerCaseCurrency} cannot be fetched from Quidax. Aborting transaction.`,
        );
        throw new NotFoundException(
          `Crypto fees for ${lowerCaseCurrency} cannot be fetched or are not available from Quidax.`,
        );
      }

      // 2. Get the specific network fee for the *deposited amount*
      // For range fees, we need to find the fee corresponding to the actual deposited amount.
      let networkFee: number;
      if (quidaxFeeData.type === 'flat') {
        networkFee = quidaxFeeData.fee as number;
      } else {
        // type is 'range'
        const ranges = quidaxFeeData.fee as FeeRange[];
        let foundFee = 0;
        for (const range of ranges) {
          if (
            depositedCryptoAmount >= range.min &&
            depositedCryptoAmount <= range.max
          ) {
            foundFee = range.value;
            break;
          }
        }
        // If amount is higher than the max of the largest range, use the fee from the last range
        if (
          depositedCryptoAmount > ranges[ranges.length - 1].max &&
          ranges.length > 0
        ) {
          foundFee = ranges[ranges.length - 1].value;
        }
        networkFee = foundFee;
      }

      // 3. Get our In-House Fee
      const inHouseFee = IN_HOUSE_FEES[lowerCaseCurrency];
      if (inHouseFee === undefined) {
        this.logger.error(
          `In-house fee not configured for currency: ${lowerCaseCurrency}. Aborting transaction.`,
        );
        throw new NotFoundException(
          `In-house fee configuration missing for ${lowerCaseCurrency}.`,
        );
      }

      // 4. Calculate Total Base Fees (network + in-house)
      const totalBaseFees = networkFee + inHouseFee;

      // 5. Calculate Meviné Fees (10% of total base fees)
      const mevineFees = totalBaseFees * MEVINE_FEE_PERCENTAGE;

      // 6. Calculate Total Fees (all fees combined)
      const totalAllFeesCrypto = totalBaseFees + mevineFees;

      // 7. Calculate Net Crypto Amount to be swapped to NGN
      const netCryptoAmount = depositedCryptoAmount - totalAllFeesCrypto;

      if (netCryptoAmount <= 0) {
        this.logger.warn(
          `Net crypto amount after fees is zero or negative for deposit ${depositData.id}. User will not be credited.`,
        );
        // Create a transaction record with status 'failed' or 'insufficient_deposit'
        await this.generateTransactionReceipt(
          {
            amount: 0, // No amount credited
            reference,
            user,
            currency: depositData.currency!,
            walletAddress: depositData.wallet?.deposit_address || 'N/A',
            transferAmount: 0,
            totalFees: totalAllFeesCrypto,
            status: TransactionStatusEnum.failed,
            reason: 'Deposit amount insufficient to cover fees',
          },
          session,
        );
        await session.commitTransaction();
        await session.endSession();

        return { message: 'Deposit amount too low to cover fees.' };
      }

      // 8. Get Swap Quotation for the Net Crypto Amount
      const quotation = await this.quidaxService.temporarySwapQuotation(
        user.quidaxId, // Use user's quidaxId for the swap
        {
          from_currency: lowerCaseCurrency,
          to_currency: 'NGN',
          from_amount: netCryptoAmount.toFixed(8), // Use netCryptoAmount for swap, ensure string format
        },
      );

      if (!quotation || !quotation.quoted_price) {
        this.logger.error(
          `Failed to get swap quotation for ${netCryptoAmount} ${lowerCaseCurrency}. Aborting transaction.`,
        );
        throw new HttpException(
          'Failed to get currency swap quotation',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const netNairaAmount = parseFloat(quotation.quoted_price); // The amount to transfer in NGN

      // 9. Generate Transaction Receipt for the Net Naira Amount
      await this.generateTransactionReceipt(
        {
          amount: netNairaAmount, // Use the net Naira amount
          reference,
          user,
          currency: depositData.currency!, // Original crypto currency
          walletAddress: depositData.wallet?.deposit_address || 'N/A',
          transferAmount: netNairaAmount,
          totalFees: totalAllFeesCrypto,
          status: TransactionStatusEnum.pending, // Initial status
          reason: 'Crypto currency deposit pending',
        },
        session,
      );

      // 10. Prepare and Initiate VFD Transfer Request
      const transferRequest: TransferRequest = {
        fromAccount: this.platformAccountNumber,
        fromClient: this.platformClient,
        fromClientId: this.platformClientId,
        fromSavingsId: this.platformAccountId,
        fromBvn: this.platformBVN,
        toClient: recipientDetails.name,
        toBank: recipientDetails.bank,
        toAccount: recipientDetails.account.number,
        signature: signature,
        amount: netNairaAmount.toFixed(2), // Amount in Naira, formatted to 2 decimal places as string
        remark: `Crypto Deposit: ${depositedCryptoAmount} ${depositData.currency} -> ${netNairaAmount} NGN`,
        transferType: 'intra',
        reference: `MEV-${new Date().getTime()}-${user._id.toString().substring(0, 8)}`, // More unique reference
        toClientId: recipientDetails.clientId,
        toSavingsId: recipientDetails.account.id,
        source: true,
        ...(recipientDetails.bvn && { toBvn: recipientDetails.bvn }),
      };

      const event = new InitiateTransferEvent(transferRequest);

      const transferResult =
        await this.vfdProducerService.addVfdApiOperation(event);
      this.logger.info(
        'Automated NGN transfer initiated successfully:',
        transferResult,
      );

      await session.commitTransaction(); // Commit if all successful

      return {
        message: 'Deposit processed and automated NGN transfer initiated',
        transfer: transferResult,
        details: {
          originalAmount: depositedCryptoAmount,
          totalFees: totalAllFeesCrypto,
          netAmount: netCryptoAmount,
          transferAmount: netNairaAmount,
          currency: lowerCaseCurrency,
        },
      };
    } catch (error) {
      await session.abortTransaction(); // Rollback on error

      this.logger.error(
        `Failed to process deposit and initiate NGN transfer for deposit ${depositData.id}: ${error.message}`,
        error.stack,
      );
      // Re-throw as HttpException or handle appropriately
      throw new HttpException(
        error.response?.data ||
          error.message ||
          'Failed to process deposit and initiate transfer',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  private async generateTransactionReceipt(
    body: {
      reference: string;
      amount: number;
      user: UserDocument;
      currency: string;
      walletAddress: string;
      transferAmount: number;
      totalFees: number;
      status?: TransactionStatusEnum;
      reason?: string;
    },
    session: mongoose.ClientSession,
  ): Promise<TransactionDocument> {
    try {
      const [receipt] = await this.databaseService.transactions.create(
        {
          amount: body.transferAmount, // Store the actual transfer amount in NGN
          reference: body.reference,
          service: ServiceTypeEnum.crypto,
          user: body.user._id,
          status: body.status || TransactionStatusEnum.pending,
          type: TransactionTypeEnum.funding,
          meta: {
            originalCryptoAmount: body.amount,
            totalFees: body.totalFees,
            currency: body.currency,
            reason: body.reason || 'Crypto deposit processing',
            paidFrom: {
              entityId: body.user._id.toString(),
              entityType: TransactionEntityTypeEnum.crypto,
              entityNumber: body.walletAddress,
              entityCode: body.currency,
              entityName: body.currency,
            },
            paidTo: {
              entityId: body.user._id.toString(),
              entityType: TransactionEntityTypeEnum.user,
              entityNumber: body.user.bankDetails.accountNumber,
              entityCode: body.user.bankDetails.bankCode,
              entityName: body.user.bankDetails.bankName,
            },
          },
        },
        { session },
      );
      return receipt;
    } catch (error) {
      throw error;
    }
  }

  private createTransferSignatureWithReference(body: {
    senderAccount: string;
    receiverAccount: string;
  }): ITransferKey {
    const { senderAccount, receiverAccount } = body;
    const signature = sha512(`${senderAccount}${receiverAccount}`);
    const reference = `MEV-${Math.floor(Math.random() * 1000 + 1)}${Date.now()}`;
    return { signature, reference };
  }

  private getNetworkFeeForMinimumDeposit(
    feeData: CryptoWithdrawalFees,
  ): number {
    if (feeData.type === 'flat') {
      return feeData.fee as number;
    } else if (feeData.type === 'range') {
      const ranges = feeData.fee as FeeRange[];
      if (ranges.length > 0) {
        // For minimum deposit calculation, we assume the fee for the smallest range
        return ranges[0].value;
      }
    }
    return 0; // Fallback, though ideally, all currencies would have a defined fee structure
  }
}
