import 'dotenv/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigReader {
  public readMandatory(key: string): string {
    const foundInEnv = process.env[key];
    if (!foundInEnv) {
      throw new Error(`config: ${key} is mandatory`);
    }
    return foundInEnv;
  }
}
