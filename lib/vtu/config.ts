import "server-only";
import { isIP } from "node:net";

export function parseVtuBaseUrl(value: string): { baseUrl: string; host: string } {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("VTU base URL must be a valid URL.");
  }

  const localDevelopment =
    process.env.NODE_ENV !== "production" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1");
  if (
    (url.protocol !== "https:" && !(localDevelopment && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (!localDevelopment && (isIP(url.hostname) !== 0 || !url.hostname.includes(".")))
  ) {
    throw new Error("VTU base URL must use HTTPS and contain only an allowed host.");
  }

  return { baseUrl: url.origin, host: url.host.toLowerCase() };
}
