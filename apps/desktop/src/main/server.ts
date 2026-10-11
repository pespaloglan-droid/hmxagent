/** Dashboard sunucusu giris noktasi — child process olarak calisir (Bolum 7.1). */
import { startDashboard } from "@hmx/dashboard-api";

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port <= 0) {
  console.error("Gecersiz port argumani:", process.argv[2]);
  process.exit(1);
}
startDashboard(port);
