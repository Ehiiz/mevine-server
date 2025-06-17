import { AdminUserService } from './admin-user.service';

export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}
}
