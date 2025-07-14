import {
  CreateSubAccountPayload,
  DepositCompletedData,
  WalletGeneratedData,
} from '../quidax.interface';

export enum QuidaxEventsEnum {
  CREATE_SUB_ACCOUNT = 'create.sub.account',
  INITIATE_TRANSFER = 'initiate.transfer',
  UPDATE_USER_WALLET = 'update.wallet',
}

export abstract class BaseQuidaxEvent {
  public readonly requestName: QuidaxEventsEnum;
  public readonly email: string;
  constructor(requestName: QuidaxEventsEnum, email: string) {
    this.requestName = requestName;
    this.email = email;
  }
}

export class CreateSubAccountQuidaxEvent extends BaseQuidaxEvent {
  public readonly data: CreateSubAccountPayload;
  constructor(data: CreateSubAccountPayload, email: string) {
    super(QuidaxEventsEnum.CREATE_SUB_ACCOUNT, email);
    this.data = data;
  }
}

export class UpdateUserWalletQuidaxEvent extends BaseQuidaxEvent {
  public readonly data: WalletGeneratedData;
  constructor(data: WalletGeneratedData, email: string) {
    super(QuidaxEventsEnum.UPDATE_USER_WALLET, email);
    this.data = data;
  }
}

export class CreateWithdrawalQuidaxEvent extends BaseQuidaxEvent {
  public readonly data: DepositCompletedData;
  constructor(data: DepositCompletedData, email: string) {
    super(QuidaxEventsEnum.INITIATE_TRANSFER, email);
    this.data = data;
  }
}
