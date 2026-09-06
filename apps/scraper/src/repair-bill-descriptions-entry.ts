import { loadRepoEnv } from "@acme/env/load";

loadRepoEnv();
const { main } = await import("./repair-bill-descriptions.js");
await main();
