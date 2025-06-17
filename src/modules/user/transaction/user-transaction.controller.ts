import { UserTransactionService } from './user-transaction.service';

export class UserTransactionController {
  constructor(private readonly userTxService: UserTransactionService) {}
}
