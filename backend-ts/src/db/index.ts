import pgPromise = require('pg-promise');

const pgp = pgPromise({});

export const db = pgp({
  host: "localhost",
  port: 5432,
  database: "qlitz",
  user: "postgres",
  password: "admin"
});
