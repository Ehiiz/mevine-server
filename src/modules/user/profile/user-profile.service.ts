import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service';
import { User, UserDocument } from 'src/core/database/schemas/user.schema';
import { WalletDocument } from 'src/core/database/schemas/wallet.schema';

@Injectable()
export class UserProfileService {
  constructor(private readonly databaseSerice: DatabaseService) {}

  async updateProfile(body: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    user: UserDocument;
  }): Promise<{ user: User }> {
    try {
      const { user: base, ...rest } = body;
      const user = await this.databaseSerice.users
        .findByIdAndUpdate(base._id, rest, { new: true })
        .populate('wallet');
      return { user: user!.toJSON() as any };
    } catch (error) {
      throw error;
    }
  }

  async fetchBalance(body: {
    user: UserDocument;
  }): Promise<{ balance: number }> {
    try {
      const balance = (body.user.wallet as WalletDocument).balance;

      return { balance };
    } catch (error) {
      throw error;
    }
  }
}
