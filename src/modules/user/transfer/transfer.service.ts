import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException, // For insufficient balance
  InternalServerErrorException,
  Logger, // For general transaction errors
} from '@nestjs/common';
import { sha512 } from 'js-sha512';
import { DatabaseService } from 'src/core/database/database.service';
import { ITransferKey } from 'src/core/interfaces/shared.interface';
import {
  ServiceTypeEnum,
  TransactionEntityTypeEnum,
  TransactionStatusEnum,
  TransactionTypeEnum,
  TxInfoEnum,
} from 'src/core/interfaces/transaction.interface';
import {
  Transaction,
  TransactionDocument,
} from 'src/core/database/schemas/transaction.schema';
import { User, UserDocument } from 'src/core/database/schemas/user.schema'; // Import UserDocument
import { BcryptService } from 'src/core/security/bcrypt.service';
import {
  Bank,
  Biller,
  BillerCategory,
  BillerItemsResponseData,
  CustomerValidateResponse,
  TransferRecipientResponseData,
} from 'src/modules/providers/bank/vfd/vfd.interface';
import { VFDService } from 'src/modules/providers/bank/vfd/vfd.service';
import * as mongoose from 'mongoose'; // Import mongoose for sessions
import { WalletDocument } from 'src/core/database/schemas/wallet.schema';
import { QuidaxService } from 'src/modules/providers/crypto/quidax/quidax.service';
import {
  CryptoWithdrawalFees,
  FeeRange,
} from 'src/modules/providers/crypto/quidax/quidax.interface';
import { CryptoFeesResponseDto, QuidaxRawFeeData } from './transfer.validator';
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
export class UserTransferService {
  constructor(
    private readonly bankService: VFDService,
    private readonly databaseService: DatabaseService,
    private readonly bcryptService: BcryptService,
    private readonly quidaxService: QuidaxService,
    private readonly logger: WinstonNestJSLogger,
  ) {
    this.logger.setContext(UserTransferService.name);
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

  async getBanks(): Promise<Bank[]> {
    try {
      const { data } = await this.bankService.fetchBanks();
      if (!data) {
        throw new NotFoundException('Bank lists cannot be fetched');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async fetchFees(
    currency: string,
    user: UserDocument,
  ): Promise<CryptoFeesResponseDto> {
    try {
      // Ensure currency is lowercase for consistent mapping with constants
      const lowerCaseCurrency = currency.toLowerCase();

      // 1. Fetch raw network fee data from Quidax
      const quidaxFeeData: QuidaxRawFeeData =
        await this.quidaxService.getCryptoWithdrawalFees(lowerCaseCurrency);

      if (!quidaxFeeData) {
        throw new NotFoundException(
          `Crypto fees for ${currency} cannot be fetched or are not available from Quidax.`,
        );
      }

      // 2. Get the specific network fee relevant for minimum deposit calculation
      const networkFeeForMinDeposit =
        this.getNetworkFeeForMinimumDeposit(quidaxFeeData);

      // 3. Get our In-House Fee
      const inHouseFee = IN_HOUSE_FEES[lowerCaseCurrency];
      if (inHouseFee === undefined) {
        this.logger.warn(
          `In-house fee not configured for currency: ${currency}. Please check IN_HOUSE_FEES constant.`,
        );
        throw new NotFoundException(
          `In-house fee configuration missing for ${currency}.`,
        );
      }

      // 5. Calculate Meviné Fees (10% of total base fees)
      const mevineFees = networkFeeForMinDeposit * MEVINE_FEE_PERCENTAGE;

      // 6. Calculate Total Fees (all fees combined)
      // This is the total cost of fees that needs to be covered by the deposit.
      const totalAllFees = networkFeeForMinDeposit + mevineFees;

      // 7. Determine Minimum Deposit Required Crypto
      // This minimum should cover all fees and provide a small buffer
      // to ensure the user receives a meaningful amount.
      // We'll use a 10% buffer on top of all fees, or the absolute minimum, whichever is greater.
      const minDepositBasedOnFees = totalAllFees * 1.1; // 10% buffer on top of all fees

      const absoluteMin = ABSOLUTE_MIN_DEPOSIT_CRYPTO[lowerCaseCurrency];
      if (absoluteMin === undefined) {
        this.logger.warn(
          `Absolute minimum deposit not configured for currency: ${currency}. Please check ABSOLUTE_MIN_DEPOSIT_CRYPTO constant.`,
        );
        throw new NotFoundException(
          `Absolute minimum deposit configuration missing for ${currency}.`,
        );
      }

      const minimumDepositRequiredCrypto = Math.max(
        absoluteMin,
        minDepositBasedOnFees,
      );

      const paymentAddress =
        user.cryptoAddresses.get(lowerCaseCurrency)?.address;
      if (!paymentAddress) {
        this.logger.warn(
          `Payment address not found for currency: ${currency}. Please check user's crypto addresses.`,
        );
        throw new NotFoundException(
          `Payment address for ${currency} not found in user's crypto addresses.`,
        );
      }

      // Construct the response DTO with all calculated fields
      const responseDto: CryptoFeesResponseDto = {
        type: quidaxFeeData.type,
        fee: quidaxFeeData.fee, // This is the raw network fee structure from Quidax
        networkFeeForMinDeposit: parseFloat(networkFeeForMinDeposit.toFixed(8)), // Round for precision
        inHouseFee: parseFloat(inHouseFee.toFixed(8)),
        mevineFees: parseFloat(mevineFees.toFixed(8)),
        minimumDepositRequiredCrypto: parseFloat(
          minimumDepositRequiredCrypto.toFixed(8),
        ),
        paymentAddress: paymentAddress,
      };

      const quotation = await this.quidaxService.temporarySwapQuotation('me', {
        from_currency: lowerCaseCurrency,
        to_currency: 'ngn',
        from_amount: minimumDepositRequiredCrypto.toFixed(6),
      });

      responseDto.swapAmount = quotation.to_amount;

      return responseDto;
    } catch (error) {
      this.logger.error(
        `Error fetching or calculating fees for ${currency}: ${error.message}`,
        error.stack,
      );
      // Re-throw the error for NestJS's global exception filter to handle
      throw error;
    }
  }

  async confirmBankDetails(body: {
    accountNo: string;
    bank: string;
  }): Promise<TransferRecipientResponseData> {
    try {
      const { data } = await this.bankService.verifyBankDetails({
        accountNo: body.accountNo,
        bank: body.bank,
        transfer_type: this.getTransferType(body.bank),
      });

      if (!data) {
        throw new NotFoundException(
          'Account owner not verified. Please check and reconfirm.',
        );
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getBillers(): Promise<BillerCategory[]> {
    try {
      const { data } = await this.bankService.getBillerCategories();
      if (!data) {
        throw new NotFoundException('Biller categories cannot be found.');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getBillerList(body: { category?: string }): Promise<Biller[]> {
    try {
      const { data } = await this.bankService.getBillerList(body.category);
      if (!data) {
        throw new NotFoundException('Biller list cannot be fetched.');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getBillerItems(body: {
    billerId: string;
    divisionId: string;
    productId: string;
  }): Promise<BillerItemsResponseData> {
    try {
      const { data } = await this.bankService.getBillerItems(body);
      if (!data) {
        throw new NotFoundException('Biller items cannot be fetched.');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async validateBillCustomer(body: {
    billerId: string;
    divisionId: string;
    paymentItem: string;
    customerId: string;
  }): Promise<any> {
    try {
      return {
        customerName: 'John Doe', // Mocked customer name for example
        address: '123 Main St', // Mocked address for example
        vendType: 'prepaid', // Use the provided customerId
      };
      const data = await this.bankService.validateCustomer(body);
      if (!data) {
        throw new NotFoundException('Customer validation failed.');
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  async processTransaction(body: {
    user: UserDocument; // Ensure it's UserDocument for wallet access
    transactionPin: string;
    service: ServiceTypeEnum;
    amount: number;
    division?: string;
    paymentItem?: string;
    productId?: string;
    billerId?: string;
    phoneNumber?: string;
    accountNumber?: string;
    bankName?: string;
    bankCode?: string;
    customerName?: string;
    customerId?: string;
    remark: string;
    image?: string;
  }): Promise<Transaction> {
    const session = await this.databaseService.users.startSession(); // Start a Mongoose session
    session.startTransaction(); // Start a transaction

    try {
      // 1. Verify Transaction Pin
      const match = await this.bcryptService.comparePassword({
        password: body.transactionPin,
        hashedPassword: body.user.auth.transactionPin!,
      });
      if (!match) {
        throw new UnauthorizedException('Invalid transaction pin.');
      }

      // 2. Deduct Balance (Atomic with transaction)
      // Pass the session to ensure all balance updates are part of the transaction
      await this.deductUserBalance(body.user, body.amount, session);

      let receipt: TransactionDocument;

      // 3. Process Service Specific Logic
      if (body.service === ServiceTypeEnum.transfer) {
        receipt = await this.processFundsTransfer(
          {
            user: body.user,
            amount: body.amount.toString(),
            remark: body.remark,
            transferType: this.getTransferType(body.bankCode!),
            reference: `MEV-${new Date().getTime()}`, // Use timestamp for uniqueness
            accountNumber: body.accountNumber!,
            bankCode: body.bankCode!,
            service: body.service,
          },
          session, // Pass session
        );
      } else if (
        body.service === ServiceTypeEnum.airtime ||
        body.service === ServiceTypeEnum.cable || // Fix: Ensure logical OR for all services
        body.service === ServiceTypeEnum.data ||
        body.service === ServiceTypeEnum.electricity ||
        body.service === ServiceTypeEnum.giftcard
      ) {
        receipt = await this.billPayments(
          {
            user: body.user,
            service: body.service,
            customerId: body.customerId!,
            amount: body.amount.toString(),
            paymentItem: body.paymentItem!,
            division: body.division!,
            productId: body.productId!,
            billerId: body.billerId!,
            reference: `MEV-${new Date().getTime()}`, // Use timestamp for uniqueness
            transactionType: this.getTransactionType(body.service), // This actually generates an EntityType
          },
          session, // Pass session
          body.service === ServiceTypeEnum.giftcard, // Pass giftcard flag
          body.service === ServiceTypeEnum.giftcard ? body.image : undefined, // Optional image for giftcard
        );
      } else {
        throw new BadRequestException('Invalid or unsupported service type.');
      }

      // 4. Commit Transaction if all successful
      await session.commitTransaction();

      return receipt;
    } catch (error) {
      // 5. Abort Transaction if any error occurs
      await session.abortTransaction();

      // Re-throw the specific error type for better API responses
      throw error;
    } finally {
      await session.endSession();
    }
  }

  // Helper to deduct user balance within a session
  // Helper to deduct user balance within a session
  private async deductUserBalance(
    user: UserDocument,
    amount: number,
    session: mongoose.ClientSession,
  ): Promise<void> {
    // Ensure wallet is populated
    if (!user.wallet) {
      // If AuthGuard doesn't populate, fetch it here within the session
      // The 'as UserDocument' is to ensure TypeScript understands the re-assignment type
      user = (await this.databaseService.users
        .findById(user._id)
        .populate('wallet')
        .session(session)
        .exec()) as UserDocument;
      if (!user || !user.wallet) {
        throw new NotFoundException('User wallet not found.');
      }
    }

    if (user.wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance.');
    }

    user.wallet.balance -= amount;
    // Save wallet changes within the current session
    // FIX: Removed redundant cast for user.wallet as it should be WalletDocument after population
    await user.wallet.save({ session });
  }

  async billPayments(
    body: {
      user: UserDocument;
      service: ServiceTypeEnum;
      transactionType: TransactionEntityTypeEnum; // This param seems to be for `entityType` in meta
      customerId: string; // Phone Number or Meter Number
      amount: string; // Bill cost
      division: string; // from billerList.division
      paymentItem: string; // from billerItems.paymentCode
      productId: string; // from billerList.product
      billerId: string; // from billerList.id
      reference: string; // Unique, prefixed with walletName or name of choice
      phoneNumber?: string; // Optional for some products (e.g., electricity)
    },
    session: mongoose.ClientSession, // Accept session
    giftcard: boolean = false, // Optional param to handle giftcard payments
    image?: string, // Optional image for giftcard
  ): Promise<TransactionDocument> {
    try {
      const { user, service, transactionType, ...billData } = body;

      const entityId = giftcard ? user.id : billData.billerId;
      const entityNumber = giftcard
        ? billData.paymentItem
        : billData.customerId;
      const entityName = giftcard ? billData.paymentItem : billData.division;

      // Create transaction receipt within session
      const receipt = await this.generateTransactionReceipt(
        {
          user,
          reference: billData.reference,
          amount: parseInt(billData.amount),
          entityId,
          entityType: transactionType, // Use provided transactionType
          entityNumber,
          entityCode: billData.paymentItem, // Payment item code stays same
          entityName,
          service,
        },
        session, // Pass session
      );

      if (service === ServiceTypeEnum.giftcard) {
        receipt.additionalDetails = [
          { title: TxInfoEnum.giftcard_image, info: image! },
          { title: TxInfoEnum.giftcard_code, info: billData.paymentItem! },
        ];
      }

      if (giftcard) {
        await receipt.save({ session }); // Save status update within session

        return receipt; // If it's a giftcard, we don't proceed with external payment
      }

      // Perform external payment
      const { data } = await this.bankService.payBill(billData);

      if (!data) {
        receipt.status = TransactionStatusEnum.failed;
        await receipt.save({ session }); // Save status update within session
        throw new InternalServerErrorException(
          'Error processing bill payment with external service.',
        );
      }

      if (service === ServiceTypeEnum.electricity) {
        receipt.additionalDetails = [
          { title: TxInfoEnum.token, info: data.token! },
        ];
      }

      receipt.status = TransactionStatusEnum.completed;
      await receipt.save({ session }); // Save status update within session

      return receipt;
    } catch (error) {
      // If bill payment fails, the transaction is already aborted by processTransaction
      throw error; // Re-throw for processTransaction to catch and abort
    }
  }

  private async processFundsTransfer(
    body: {
      user: UserDocument; // UserDocument
      service: ServiceTypeEnum;
      amount: string;
      remark: string;
      transferType: 'intra' | 'inter';
      reference: string;
      bankCode: string;
      accountNumber: string;
    },
    session: mongoose.ClientSession, // Accept session
  ): Promise<TransactionDocument> {
    try {
      const recipientDetails = await this.confirmBankDetails({
        bank: body.bankCode,
        accountNo: body.accountNumber,
      });

      const { data: senderDetails } = await this.bankService.getAccountBalance(
        body.user.bankDetails.accountNumber,
      );

      if (!senderDetails) {
        throw new InternalServerErrorException(
          'Sender account details could not be retrieved.',
        );
      }

      const { signature } = this.createTransferSignatureWithReference({
        senderAccount: body.user.bankDetails.accountNumber,
        receiverAccount: body.accountNumber,
      });

      // Ensure transaction is created within the session
      const receipt = await this.generateTransactionReceipt(
        {
          user: body.user,
          reference: body.reference,
          amount: parseInt(body.amount),
          entityId: recipientDetails.account.number,
          entityType: TransactionEntityTypeEnum.user, // Assuming recipient is always a user entity
          entityNumber: recipientDetails.account.number,
          entityCode: body.bankCode,
          entityName: recipientDetails.name,
          service: body.service,
        },
        session, // Pass session
      );

      await this.bankService.transferFunds({
        fromAccount: body.user.bankDetails.accountNumber,
        fromClient: senderDetails.client,
        fromClientId: senderDetails.clientId,
        fromSavingsId: senderDetails.accountId,
        fromBvn: body.user.bankDetails.bankCode, // Assuming bankCode is BVN for some reason, verify this
        toClient: recipientDetails.name,
        toBank: recipientDetails.bank,
        toAccount: recipientDetails.account.number,
        signature: signature,
        amount: body.amount,
        remark: body.remark,
        transferType: body.transferType,
        reference: body.reference,
        ...(body.transferType === 'intra' && {
          toClientId: recipientDetails.clientId,
          toSavingsId: recipientDetails.account.id,
        }),
        ...(recipientDetails.bvn && { toBvn: recipientDetails.bvn }),
        ...(body.transferType === 'inter' && {
          toSession: recipientDetails.account.id,
        }),
      });

      receipt.status = TransactionStatusEnum.completed;
      await receipt.save({ session }); // Save status update within session

      return receipt;
    } catch (error) {
      // If transfer fails, the transaction is already aborted by processTransaction
      throw error; // Re-throw for processTransaction to catch and abort
    }
  }

  private getTransactionType(
    service: ServiceTypeEnum,
  ): TransactionEntityTypeEnum {
    // This method seems to map ServiceTypeEnum to TransactionEntityTypeEnum.
    // It's not about 'transactionType' in the `Transaction` schema (funding, transfer, etc.)
    // but rather the type of entity involved in the transaction meta.
    // If service is a transfer, it's an external entity. Otherwise, it corresponds to the service name.
    if (service === ServiceTypeEnum.transfer) {
      return TransactionEntityTypeEnum.external;
    } else if (
      Object.values(TransactionEntityTypeEnum).includes(service as any)
    ) {
      // Direct casting if service enum string matches entity type enum string
      return service as unknown as TransactionEntityTypeEnum;
    } else {
      // Default or error handling if no direct mapping exists
      throw new InternalServerErrorException(
        `No direct entity type mapping for service: ${service}`,
      );
    }
  }

  private getTransferType(bankCode: string): 'intra' | 'inter' {
    // This logic relies on '999999' being your internal bank code
    return bankCode === '999999' ? 'intra' : 'inter';
  }

  private createTransferSignatureWithReference(body: {
    senderAccount: string;
    receiverAccount: string;
  }): ITransferKey {
    const { senderAccount, receiverAccount } = body;
    const signature = sha512(`${senderAccount}${receiverAccount}`);
    const reference = `${Math.floor(Math.random() * 1000 + 1)}${Date.now()}`;
    return { signature, reference };
  }

  private async generateTransactionReceipt(
    body: {
      reference: string;
      amount: number;
      user: UserDocument;
      entityId: string;
      entityType: TransactionEntityTypeEnum;
      entityCode: string;
      entityNumber: string;
      entityName: string;
      service: ServiceTypeEnum;
    },
    session: mongoose.ClientSession,
  ): Promise<TransactionDocument> {
    try {
      // Build the two ends
      const userBankDetails = {
        entityId: body.user._id.toString(),
        entityType: TransactionEntityTypeEnum.user,
        entityNumber: body.user.bankDetails.accountNumber,
        entityCode: body.user.bankDetails.bankCode,
        entityName: body.user.bankDetails.bankName,
      };

      const targetDetails = {
        entityId: body.entityId,
        entityType: body.entityType,
        entityNumber: body.entityNumber,
        entityCode: body.entityCode,
        entityName: body.entityName,
      };

      // Swap if service is giftcard
      const [paidFrom, paidTo] =
        body.service === ServiceTypeEnum.giftcard
          ? [targetDetails, userBankDetails]
          : [userBankDetails, targetDetails];

      const [receipt] = await this.databaseService.transactions.create(
        [
          {
            amount: body.amount,
            reference: body.reference,
            service: body.service,
            user: body.user._id,
            status: TransactionStatusEnum.pending,
            type:
              body.service === ServiceTypeEnum.transfer
                ? TransactionTypeEnum.transfer
                : TransactionTypeEnum.funding,
            meta: {
              paidFrom,
              paidTo,
            },
          },
        ],
        { session },
      );

      return receipt;
    } catch (error) {
      throw error;
    }
  }
}
