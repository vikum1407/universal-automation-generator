import { db } from "./index";

async function test() {
  const now = await db.one("SELECT NOW()");
  console.log("DB connected:", now);
}

test();
