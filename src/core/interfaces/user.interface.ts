export enum BlockchainEnum {
  bitcoin = 'btc',
  ethereum = 'eth',
  usdt = 'usdt',
  tron = 'trx',
  sol = 'sol',
}

export interface IBankDetails {
  accountNumber: string;
  bankName: string;
  bankCode: string;
  accountName: string;
}

export interface ICryptoDetails {
  address: string;
  set: boolean;
}

// Define a new interface for the flattened notification response structure
export interface FlattenedUserNotification {
  _id: string; // The ID of the Notification content, as a string
  icon: string;
  title: string;
  description: string;
  initiator: string; // Admin ID as a string
  isBroadcast: boolean;
  targetUsers: string[]; // Array of User IDs as strings
  createdAt: Date;
  updatedAt: Date;
  read: boolean;
  archived: boolean;
  userNotificationId: string; // The ID of the UserNotification instance, as a string
}
