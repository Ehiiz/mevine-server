import { UserAuthService } from './user-auth.service';

export class UserAuthController {
  constructor(private readonly userTxService: UserAuthService) {}
}
