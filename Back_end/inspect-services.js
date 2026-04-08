const { query } = require('./config/database');
async function run() {
  const result = await query("SELECT * FROM services");
  console.log(JSON.stringify(result.rows, null, 2));
  process.exit(0);
}
run();
