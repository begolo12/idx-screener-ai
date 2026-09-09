import { ZpiClient } from "zpi-sdk";

const DEFAULT_KEYS = [
  "zpi_0vugred5zqviw0ic9cod98gcid",
  "zpi_fszd2k6uzgactld5m5cbydheas",
  "zpi_81yo40ht5ll4fnb27ilml68seh",
  "zpi_4pit19pb7wajsf4ka8uerszxuq",
  "zpi_kk6vaqp5e5j9hmhdothhjoha5u",
];

const envKeys = process.env.ZAPI_API_KEYS
  ? process.env.ZAPI_API_KEYS.split(",").map((k) => k.trim()).filter(Boolean)
  : (process.env.ZAPI_API_KEY ? [process.env.ZAPI_API_KEY] : []);

const ALL_API_KEYS = Array.from(new Set([...envKeys, ...DEFAULT_KEYS]));

class RotationalZpiClient {
  private clients: ZpiClient[];
  private currentIdx = 0;
  private failureTimes: number[];

  constructor(keys: string[]) {
    this.clients = keys.map(
      (apiKey) => new ZpiClient({ apiKey, timeoutMs: 10000, maxRetries: 1 })
    );
    this.failureTimes = new Array(keys.length).fill(0);
  }

  async run(namespace: string, action: string, params: Record<string, any> = {}): Promise<any> {
    const total = this.clients.length;
    let lastError: any = null;
    const now = Date.now();

    for (let attempt = 0; attempt < total; attempt++) {
      const idx = (this.currentIdx + attempt) % total;

      // Skip keys that failed recently (within 60s cooldown) unless all have failed
      if (this.failureTimes[idx] && now - this.failureTimes[idx] < 60000 && attempt < total - 1) {
        continue;
      }

      const client = this.clients[idx];

      try {
        const result = await client.run(namespace, action, params);
        // Advance pointer for fair round-robin load distribution
        this.currentIdx = (idx + 1) % total;
        this.failureTimes[idx] = 0;
        return result;
      } catch (err: any) {
        lastError = err;
        this.failureTimes[idx] = Date.now();
        console.warn(`[Zapi Key Pool] Key #${idx + 1} hit error (${err?.message || err}). Rotating to next key...`);
      }
    }

    throw lastError || new Error("All Zapi keys in rotation pool failed");
  }
}

export const zpi = new RotationalZpiClient(ALL_API_KEYS);

