import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { sha512 } from 'js-sha512';
import { DatabaseService } from 'src/core/database/database.service';
import { ITransferKey } from 'src/core/database/interfaces/shared.interface';
import {
  ServiceTypeEnum,
  TransactionEntityTypeEnum,
  TransactionStatusEnum,
  TxInfoEnum,
} from 'src/core/database/interfaces/transaction.interface';
import {
  Transaction,
  TransactionDocument,
} from 'src/core/database/schemas/transaction.schema';
import { User } from 'src/core/database/schemas/user.schema';
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

export class UserTransferService {
  constructor(
    private readonly bankService: VFDService,
    private readonly databaseService: DatabaseService,
    private readonly bcryptService: BcryptService,
  ) {}

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
          'Account owner not verified, Please check and reconfirm',
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
        throw new NotFoundException('Billers categories cannot be found');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async getBillerList(body: { category: string }): Promise<Biller[]> {
    try {
      const { data } = await this.bankService.getBillerList(body.category);
      if (!data) {
        throw new NotFoundException('Billers list cannot be fetched');
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
        throw new NotFoundException('Biller items cannot be fetched');
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
  }): Promise<CustomerValidateResponse> {
    try {
      const data = await this.bankService.validateCustomer(body);
      if (!data) {
        throw new NotFoundException('Biller items cannot be fetched');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async processTransaction(body: {
    user: User;
    transactionPin: string;
    service: ServiceTypeEnum;
    amount: number;
    division?: string;
    paymentItem?: string;
    productId: string;
    billerId: string;
    phoneNumber?: string;
    accountNumber?: string;
    bankName?: string;
    bankCode?: string;
    customerName?: string;
    customerId?: string;
    remark: string;
  }): Promise<Transaction> {
    try {
      const match = await this.bcryptService.comparePassword({
        password: body.transactionPin,
        hashedPassword: body.user.auth.transactionPin!,
      });

      if (!match) {
        throw new UnauthorizedException('Invalid transaction pin');
      }

      let receipt: Transaction;

      if (body.service === ServiceTypeEnum.transfer) {
        receipt = await this.processFundsTransfer({
          user: body.user,
          amount: body.amount.toString(),
          remark: body.remark,
          transferType: this.getTransferType(body.bankCode!),
          reference: `MEV-${new Date()}`,
          accountNumber: body.accountNumber!,
          bankCode: body.bankCode!,
          service: body.service,
        });
      } else if (
        body.service === ServiceTypeEnum.airtime ||
        ServiceTypeEnum.cable ||
        ServiceTypeEnum.data ||
        ServiceTypeEnum.electricty
      ) {
        receipt = await this.billPayments({
          user: body.user,
          service: body.service,
          customerId: body.customerId!,
          amount: body.amount.toString(),
          paymentItem: body.paymentItem!,
          division: body.division!,
          productId: body.productId,
          billerId: body.billerId,
          reference: `MEV-${new Date()}`,
          transactionType: this.getTransactionType(body.service),
        });
      } else {
        throw new Error('Invalid service type');
      }

      return receipt;
    } catch (error) {
      throw error;
    }
  }

  async billPayments(body: {
    user: User;
    service: ServiceTypeEnum;
    transactionType: TransactionEntityTypeEnum;
    customerId: string; // Phone Number or Meter Number
    amount: string; // Bill cost
    division: string; // from billerList.division
    paymentItem: string; // from billerItems.paymentCode
    productId: string; // from billerList.product
    billerId: string; // from billerList.id
    reference: string; // Unique, prefixed with walletName or name of choice
    phoneNumber?: string; // Optional for some products (e.g., electricity)
  }): Promise<Transaction> {
    try {
      const { user, service, transactionType, ...billData } = body;

      const receipt = await this.generateTransactionReceipt({
        user: body.user,
        reference: billData.reference,
        amount: parseInt(billData.amount),
        entityId: billData.billerId,
        entityType: transactionType,
        entityNumber: billData.productId,
        entityCode: billData.paymentItem,
        entityName: billData.division,
        service: service,
      });

      const { data } = await this.bankService.payBill(billData);

      if (!data) {
        receipt.status = TransactionStatusEnum.failed;
        await receipt.save();
        throw new NotFoundException('Error processing bill payment');
      }

      if (service === ServiceTypeEnum.electricty) {
        receipt.additionalDetails = [
          { title: TxInfoEnum.token, info: data.token! },
        ];
      }

      receipt.status = TransactionStatusEnum.completed;
      await receipt.save();

      return receipt;
    } catch (error) {
      throw error;
    }
  }

  private async processFundsTransfer(body: {
    user: User;
    service: ServiceTypeEnum;
    amount: string;
    remark: string;
    transferType: 'intra' | 'inter';
    reference: string;
    bankCode: string;
    accountNumber: string;
  }): Promise<Transaction> {
    try {
      const recipientDetails = await this.confirmBankDetails({
        bank: body.bankCode,
        accountNo: body.accountNumber,
      });

      const { data: senderDetails } = await this.bankService.getAccountBalance(
        body.user.bankDetails.accountNumber,
      );

      if (!senderDetails) {
        throw new UnauthorizedException('Sender account invalid');
      }

      const { signature } = this.createTransferSignatureWithReference({
        senderAccount: body.user.bankDetails.accountNumber,
        receiverAccount: body.accountNumber,
      });

      const receipt = await this.generateTransactionReceipt({
        user: body.user,
        reference: body.reference,
        amount: parseInt(body.amount),
        entityId: recipientDetails.account.number,
        entityType: TransactionEntityTypeEnum.user,
        entityNumber: recipientDetails.account.number,
        entityCode: body.bankCode,
        entityName: recipientDetails.name,
        service: body.service,
      });

      await this.bankService.transferFunds({
        fromAccount: body.user.bankDetails.accountNumber,
        fromClient: senderDetails.client,
        fromClientId: senderDetails.clientId,
        fromSavingsId: senderDetails.accountId,
        fromBvn: body.user.bankDetails.bankCode,
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
      await receipt.save();

      return receipt;
    } catch (error) {
      throw error;
    }
  }

  private getTransactionType(
    service: ServiceTypeEnum,
  ): TransactionEntityTypeEnum {
    if (service === ServiceTypeEnum.transfer) {
      return TransactionEntityTypeEnum.external;
    } else {
      return service.toString() as unknown as TransactionEntityTypeEnum;
    }
  }

  private getTransferType(bankCode: string): 'intra' | 'inter' {
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

  private async generateTransactionReceipt(body: {
    reference: string;
    amount: number;
    user: User;
    entityId: string;
    entityType: TransactionEntityTypeEnum;
    entityCode: string;
    entityNumber: string;
    entityName: string;
    service: ServiceTypeEnum;
  }): Promise<TransactionDocument> {
    try {
      const receipt = await this.databaseService.transactions.create({
        amount: body.amount,
        reference: body.reference,
        service: body.service,
        user: body.user._id,
        meta: {
          paidFrom: {
            entityId: body.user._id.toString(),
            entityType: TransactionEntityTypeEnum.user,
            entityNumber: body.user.bankDetails.accountNumber,
            entityCode: body.user.bankDetails.bankCode,
            entityName: body.user.bankDetails.bankName,
          },
          paidTo: {
            entityId: body.entityId,
            entityType: body.entityType,
            entityNumber: body.entityNumber,
            entityCode: body.entityCode,
            entityName: body.entityName,
          },
        },
      });

      return receipt;
    } catch (error) {
      throw error;
    }
  }
}
