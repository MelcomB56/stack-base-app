import * as tls from "tls";
import { PrismaClient } from "../../generated/prisma/client";

interface CertInfo {
  domain: string;
  validFrom: Date | null;
  validTo: Date | null;
  issuer: string | null;
  subject: string | null;
  daysLeft: number | null;
}

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname || null;
  } catch {
    return null;
  }
}

function checkCertTls(hostname: string): Promise<CertInfo> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, timeout: 10_000, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate();
        socket.destroy();

        if (!cert || !cert.valid_to) {
          reject(new Error("Kein Zertifikat empfangen"));
          return;
        }

        const validTo = new Date(cert.valid_to);
        const validFrom = cert.valid_from ? new Date(cert.valid_from) : null;
        const daysLeft = Math.ceil((validTo.getTime() - Date.now()) / 86_400_000);
        const issuer =
          (cert.issuer as Record<string, string>)?.O ||
          (cert.issuer as Record<string, string>)?.CN ||
          null;
        const subject =
          (cert.subject as Record<string, string>)?.CN || hostname;

        resolve({ domain: hostname, validFrom, validTo, issuer, subject, daysLeft });
      }
    );

    socket.on("error", reject);
    socket.on("timeout", () => { socket.destroy(); reject(new Error("Timeout")); });
  });
}

async function checkAndStore(db: PrismaClient, appId: string, urlProd: string): Promise<void> {
  const domain = extractDomain(urlProd);
  if (!domain) return;

  try {
    const info = await checkCertTls(domain);
    const status =
      info.daysLeft === null ? "UNKNOWN"
      : info.daysLeft < 0   ? "EXPIRED"
      : info.daysLeft < 30  ? "EXPIRING_SOON"
      : "VALID";

    await db.certCheck.create({
      data: {
        appId,
        domain,
        validFrom: info.validFrom,
        validTo: info.validTo,
        issuer: info.issuer,
        subject: info.subject,
        daysLeft: info.daysLeft,
        status: status as never,
      },
    });
  } catch (err) {
    await db.certCheck.create({
      data: {
        appId,
        domain,
        status: "ERROR",
        errorMsg: err instanceof Error ? err.message.slice(0, 500) : String(err),
      },
    });
  }
}

export async function checkCertForApp(db: PrismaClient, appId: string, urlProd: string): Promise<void> {
  await checkAndStore(db, appId, urlProd);
}

export async function runCertChecks(db: PrismaClient): Promise<number> {
  const apps = await db.app.findMany({
    where: { deletedAt: null, urlProd: { not: null } },
    select: { id: true, urlProd: true },
  });

  await Promise.allSettled(
    apps.map((app) => checkAndStore(db, app.id, app.urlProd!))
  );

  return apps.length;
}
