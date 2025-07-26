import { ITransferKey } from '../interfaces/shared.interface';
import { sha512 } from 'js-sha512';

export function generateRandomDigits() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createTransferSignatureWithReference(body: {
  senderAccount: string;
  receiverAccount: string;
}): ITransferKey {
  const { senderAccount, receiverAccount } = body;
  const signature = sha512(`${senderAccount}${receiverAccount}`);
  const reference = `MEV-${Math.floor(Math.random() * 1000 + 1)}${Date.now()}`;
  return { signature, reference };
}
