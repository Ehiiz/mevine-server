import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BcryptService {
  constructor() {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);

    const hash = await bcrypt.hash(password, salt);
    return hash;
  }

  async comparePassword(body: {
    password: string;
    hashedPassword: string;
  }): Promise<boolean> {
    const { password, hashedPassword } = body;
    return bcrypt.compare(password, hashedPassword);
  }
}
