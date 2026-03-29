import pgPromise from "pg-promise";

const pgp = pgPromise({});

const db = pgp({
  connectionString: process.env.DATABASE_URL,
  max: 10
});

export default db;
