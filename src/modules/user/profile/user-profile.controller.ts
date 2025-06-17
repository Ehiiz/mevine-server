import { UserProfileService } from './user -profile.service';

export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}
}
