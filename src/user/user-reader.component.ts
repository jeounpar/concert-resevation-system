import { Injectable } from '@nestjs/common';

@Injectable()
export class UserReaderComponent {
  constructor() {}

  async getByUserId({ userId }: { userId: number }) {
    return 1;
  }
}
