import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import mongoose from 'mongoose';
import { DatabaseService } from 'src/core/database/database.service';
import { User, UserDocument } from 'src/core/database/schemas/user.schema';
import { FormattedUserSchema } from './admin-user.validator';

@Injectable()
export class AdminUserService {
  constructor(private readonly databaseService: DatabaseService) {}

  private formatUser(user: UserDocument): FormattedUserSchema {
    return {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      joinedDate: user.createdAt,
      status: user.accountStatus.accountVerified,
      accountNumber: user.bankDetails?.accountNumber ?? 'N/A',
      kycVerified: user.accountStatus.kycVerified,
    };
  }

  async fetchUsersWithQuery(body: {
    page: number;
    limit: number;
    from?: string;
    to?: string;
    search?: string;
    restricted?: boolean;
  }): Promise<{
    currentPage: number;
    totalPages: number;
    users: User[];
    count: number;
  }> {
    try {
      const query: any = {};
      const skip = (body.page - 1) * body.limit;

      if (body.search) {
        const searchRegex = { $regex: body.search, options: 'i' };
        query.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { 'bankDetails.accountNumber': searchRegex },
        ];
      }

      if (body.restricted) {
        query.restricted = body.restricted;
      }

      if (body.from || body.to) {
        query.createdAt = {};
        if (body.from) {
          const fromDate = new Date(body.from);
          if (isNaN(fromDate.getTime())) {
            throw new BadRequestException('Invalid "from" date format.');
          }
          query.createdAt.$gte = fromDate;
        }
        if (body.to) {
          const toDate = new Date(body.to);
          if (isNaN(toDate.getTime())) {
            throw new BadRequestException('Invalid "to" date format.');
          }

          toDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = toDate;
        }
      }

      const [users, countResult] = await Promise.all([
        this.databaseService.users
          .find(query)
          .skip(skip)
          .limit(body.limit)
          .exec(),
        this.databaseService.users.countDocuments(query),
      ]);

      return {
        currentPage: body.page,
        users,
        count: countResult,
        totalPages: Math.ceil(countResult / body.limit),
      };
    } catch (error) {
      throw error;
    }
  }

  async fetchAUser(body: { id: mongoose.Types.ObjectId }): Promise<User> {
    try {
      const user = await this.databaseService.users.findById(body.id).exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async banAUser(body: { id: mongoose.Types.ObjectId }): Promise<User> {
    try {
      const user = await this.databaseService.users
        .findByIdAndUpdate(body.id, { restricted: true }, { new: true })
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async deleteAUser(body: { id: mongoose.Types.ObjectId }): Promise<User> {
    try {
      const user = await this.databaseService.users
        .findByIdAndUpdate(body.id, { deleted: true }, { new: true })
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}
