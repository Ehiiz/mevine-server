import { UserDocument } from 'src/core/database/schemas/user.schema';

declare global {
  namespace Express {
    export interface Request {
      user: UserDocument;
    }
  }
}
