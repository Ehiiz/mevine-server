export enum TransactionStatusEnum {
  initiated = 'initiated',
  pending = 'pending',
  processing = 'processing',
  completed = 'completed',
  cancelled = 'cancelled',
  failed = 'failed',
}

export enum ServiceTypeEnum {
  airtime = 'airtime',
  data = 'data',
  cable = 'cable',
  electricity = 'electricity', // Corrected typo: electricty -> electricity
  giftcard = 'giftcard',
  transfer = 'transfer',
  crypto = 'crypto',
}

export enum TransactionTypeEnum {
  funding = 'funding',
  transfer = 'transfer',
  withdrawal = 'withdrawal',
  charges = 'charges',
  commission = 'commission',
  refund = 'refund',
  reversal = 'reversal',
  request = 'request',
}

export enum TransactionEntityTypeEnum {
  user = 'user',
  airtime = 'airtime',
  data = 'data',
  cable = 'cable',
  electricity = 'electricity', // Corrected typo: electricty -> electricity
  giftcard = 'giftcard',
  crypto = 'crypto',
  external = 'external',
}

export enum TxInfoEnum {
  token = 'token',
  general = 'general',
  error = 'error',
  info = 'info',
}

export interface IMetaInfo {
  /*
    For user this will store the mongoId
    for other services it will store the service id
    as provided by the provider
    In the case of crypto it will also store the userId
    */
  entityId: string;
  /* This property records the transaction type,
    in most instances it will be the user as he is key
    actor but it could also carry others in the case of a transfer */
  entityType: TransactionEntityTypeEnum;
  /* For user this will carry the bank code
    from which it transfers from.
    Bank code will usually be stored in user doc
    For  entities like data and cable
    it will carry the plancode of the service
    For airtime and electricity it will repeat the serviceId
    For crypto is will store the crypto address
    */
  entityCode: string;
  /*
    For user it will carry the account number stored
    in db. For data, airtime, cable and others,
    it will carry the phonenumber, decoder number
    or meter number respectively
    For crypto is will store the crypto address
    */
  entityNumber: string;
  /*
    For user it will carry the bank name stored
    in db. For data, airtime, cable and others,
    it will carry the plan name. For electricity
    it will store the amount and meter number
    concatted
    For crypto is will store the provider address
    concatted with the user name
    */
  entityName: string;
}

export interface IExtraInfo {
  title: TxInfoEnum;
  info: string;
}
