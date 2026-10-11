/** Dashboard sunucusu giris noktasi — child process olarak calisir (Bolum 7.1). */
import { getLogger } from "@hmx/core";
import { startDashboard } from "@hmx/dashboard-api";

process.on("uncaughtException", (error) => {
  getLogger("crash").error("Sunucu yakalanmamış hatası", { error });
  process.exit(1);
});
process.on("unhandledRejection", (error) => {
  getLogger("crash").error("Sunucu Promise hatası", { error });
  process.exit(1);
});

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port <= 0) {
  console.error("Gecersiz port argumani:", process.argv[2]);
  process.exit(1);
}
startDashboard(port);
