import "server-only";
import { Client } from "minio";

const BUCKET = process.env.MINIO_BUCKET ?? "stack-base";

function parseEndpoint(raw: string) {
  try {
    const url = new URL(raw);
    return {
      endPoint: url.hostname,
      port: url.port ? parseInt(url.port) : url.protocol === "https:" ? 443 : 9000,
      useSSL: url.protocol === "https:",
    };
  } catch {
    return { endPoint: "localhost", port: 9000, useSSL: false };
  }
}

function createClient() {
  const { endPoint, port, useSSL } = parseEndpoint(process.env.MINIO_ENDPOINT ?? "http://localhost:9000");
  return new Client({
    endPoint,
    port,
    useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY ?? "stackbase",
    secretKey: process.env.MINIO_SECRET_KEY ?? "stackbase123",
  });
}

const globalForMinio = globalThis as unknown as { minio: Client | undefined };
export const minio = globalForMinio.minio ?? createClient();
if (process.env.NODE_ENV !== "production") globalForMinio.minio = minio;

let bucketReady = false;

export async function ensureBucket() {
  if (bucketReady) return;
  const exists = await minio.bucketExists(BUCKET);
  if (!exists) {
    await minio.makeBucket(BUCKET);
    // Bucket auf öffentlich lesbar setzen
    await minio.setBucketPolicy(BUCKET, JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
      }],
    }));
  }
  bucketReady = true;
}

export async function uploadFile(
  objectName: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  await ensureBucket();
  await minio.putObject(BUCKET, objectName, buffer, buffer.length, { "Content-Type": contentType });
  // MINIO_PUBLIC_URL = öffentlich erreichbare URL (z.B. https://media.stack-base.de)
  // MINIO_ENDPOINT   = interne Docker-Adresse (nur für den App-Container)
  const publicBase = (process.env.MINIO_PUBLIC_URL ?? process.env.MINIO_ENDPOINT ?? "http://localhost:9000").replace(/\/$/, "");
  return `${publicBase}/${BUCKET}/${objectName}`;
}

export async function deleteFile(objectName: string) {
  try {
    await minio.removeObject(BUCKET, objectName);
  } catch {
    // Objekt existiert nicht mehr — kein Fehler
  }
}

export function objectNameFromUrl(url: string): string {
  const publicBase = (process.env.MINIO_PUBLIC_URL ?? process.env.MINIO_ENDPOINT ?? "http://localhost:9000").replace(/\/$/, "");
  const internalBase = (process.env.MINIO_ENDPOINT ?? "http://localhost:9000").replace(/\/$/, "");
  return url
    .replace(`${publicBase}/${BUCKET}/`, "")
    .replace(`${internalBase}/${BUCKET}/`, "");
}

export { BUCKET };
