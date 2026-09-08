import { ZpiClient } from "zpi-sdk";

const apiKey = process.env.ZAPI_API_KEY || "zpi_kk6vaqp5e5j9hmhdothhjoha5u";

export const zpi = new ZpiClient({
  apiKey,
  timeoutMs: 10000,
  maxRetries: 2,
});
