const base = process.env.SERAHIN_SMOKE_URL ?? "http://localhost:3000";
const routes = ["/", "/catalog", "/seller/login", "/account/login", "/login"];
let failed = false;
for (const route of routes) {
  try {
    const response = await fetch(new URL(route, base), { redirect: "manual" });
    const ok = response.status < 500;
    console.log(`${ok ? "PASS" : "FAIL"} ${route} ${response.status}`);
    if (!ok) failed = true;
  } catch (error) {
    failed = true;
    console.error(`FAIL ${route} ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (failed) process.exitCode = 1;
