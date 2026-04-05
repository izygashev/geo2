import pg from "pg";

const client = new pg.Client("postgresql://postgres:postgres@localhost:5433/geo_saas");

async function main() {
  await client.connect();
  const res = await client.query(
    `SELECT id, status, "overallScore", "createdAt" FROM "Report" ORDER BY "createdAt" DESC LIMIT 10`
  );
  console.log("=== All Reports ===");
  for (const row of res.rows) {
    console.log(`  ${row.id} | status=${row.status} | score=${row.overallScore} | ${row.createdAt}`);
  }
  
  const users = await client.query(`SELECT id, email, credits, plan FROM "User" LIMIT 5`);
  console.log("\n=== Users ===");
  for (const row of users.rows) {
    console.log(`  ${row.id} | ${row.email} | credits=${row.credits} | plan=${row.plan}`);
  }
  
  const projects = await client.query(`SELECT id, name, url, "userId" FROM "Project" LIMIT 5`);
  console.log("\n=== Projects ===");
  for (const row of projects.rows) {
    console.log(`  ${row.id} | ${row.name} | ${row.url}`);
  }
  
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
