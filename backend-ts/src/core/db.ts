import * as dotenv from 'dotenv';
import * as path from 'path';
const pgPromise = require('pg-promise');

// Load .env BEFORE initializing pg-promise
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const pgp = pgPromise();

export const db = pgp(process.env.DATABASE_URL!);
