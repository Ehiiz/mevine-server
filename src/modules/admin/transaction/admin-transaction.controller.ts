import { AdminTransactionService } from './admin-transaction.service';

export class AdminTransactionController {
  constructor(private readonly adminTxService: AdminTransactionService) {}
}
