export enum BlockchainEnum {
  bitcoin,
  ethereum,
  usdt,
}

export interface IBankDetails {
  accountNumber: string;
  bankName: string;
  bankCode: string;
}

export interface ICryptoDetails {
  blockchain: BlockchainEnum;
  address: string;
}
