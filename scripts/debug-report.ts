import pg from "pg";

const client = new pg.Client("postgresql://postgres:postgres@localhost:5433/geo_saas");

async function main() {
  await client.connect();

  // Check the specific stuck report
  const report = await client.query(
    `SELECT id, status, "overallScore", "createdAt", "updatedAt" 
     FROM "Report" 
     WHERE id = '7769f692-a9b8-40f4-a313-8bca63f48389'`
  );
  console.log("=== Stuck Report ===");
  console.log(JSON.stringify(report.rows, null, 2));

  // Check recent reports
  const recent = await client.query(
    `SELECT id, status, "overallScore", "createdAt", "updatedAt" 
     FROM "Report" 
     ORDER BY "createdAt" DESC 
     LIMIT 5`
  );
  console.log("\n=== Recent Reports ===");
  for (const row of recent.rows) {
    console.log(`  ${row.id} | status=${row.status} | score=${row.overallScore} | created=${row.createdAt} | updated=${row.updatedAt}`);
  }

  // Check if there are any SoV results for this report (would indicate partial progress)
  const sov = await client.query(
    `SELECT COUNT(*) as count FROM "ShareOfVoice" WHERE "reportId" = '7769f692-a9b8-40f4-a313-8bca63f48389'`
  );
  console.log(`\n=== SoV records for this report: ${sov.rows[0].count} ===`);

  // Check recommendations
  const recs = await client.query(
    `SELECT COUNT(*) as count FROM "Recommendation" WHERE "reportId" = '7769f692-a9b8-40f4-a313-8bca63f48389'`
  );
  console.log(`=== Recommendations for this report: ${recs.rows[0].count} ===`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
