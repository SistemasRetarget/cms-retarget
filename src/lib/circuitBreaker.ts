import { logger } from "@/lib/logger";

type State = "CLOSED" | "OPEN" | "HALF_OPEN";

interface BreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
  timeoutMs: number;
  retries: number;
}

const DEFAULTS: BreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
  timeoutMs: 30_000,
  retries: 2,
};

class CircuitBreaker {
  private state: State = "CLOSED";
  private failures = 0;
  private openedAt = 0;

  constructor(
    private name: string,
    private opts: BreakerOptions = DEFAULTS
  ) {}

  private canAttempt(): boolean {
    if (this.state === "CLOSED") return true;
    if (this.state === "OPEN") {
      if (Date.now() - this.openedAt > this.opts.resetTimeoutMs) {
        this.state = "HALF_OPEN";
        logger.info({ breaker: this.name }, "Circuit breaker HALF_OPEN");
        return true;
      }
      return false;
    }
    return true; // HALF_OPEN: allow one probe
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state !== "CLOSED") {
      logger.info({ breaker: this.name }, "Circuit breaker CLOSED");
      this.state = "CLOSED";
    }
  }

  private onFailure() {
    this.failures++;
    if (this.state === "HALF_OPEN" || this.failures >= this.opts.failureThreshold) {
      this.state = "OPEN";
      this.openedAt = Date.now();
      logger.warn(
        { breaker: this.name, failures: this.failures },
        "Circuit breaker OPEN"
      );
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canAttempt()) {
      throw new Error(`Circuit breaker OPEN for ${this.name}`);
    }

    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this.opts.retries; attempt++) {
      try {
        const result = await this.withTimeout(fn());
        this.onSuccess();
        return result;
      } catch (e) {
        lastError = e as Error;
        const isLastAttempt = attempt === this.opts.retries;
        if (!isLastAttempt) {
          const backoff = Math.min(1000 * Math.pow(2, attempt), 5000);
          logger.warn(
            { breaker: this.name, attempt: attempt + 1, error: lastError.message },
            "Retrying after failure"
          );
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }

    this.onFailure();
    throw lastError ?? new Error(`${this.name} failed`);
  }

  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`${this.name} timeout after ${this.opts.timeoutMs}ms`)),
        this.opts.timeoutMs
      );
      promise
        .then((v) => {
          clearTimeout(timer);
          resolve(v);
        })
        .catch((e) => {
          clearTimeout(timer);
          reject(e);
        });
    });
  }
}

const breakers = new Map<string, CircuitBreaker>();

export function getBreaker(name: string, opts?: Partial<BreakerOptions>): CircuitBreaker {
  let b = breakers.get(name);
  if (!b) {
    b = new CircuitBreaker(name, { ...DEFAULTS, ...opts });
    breakers.set(name, b);
  }
  return b;
}
