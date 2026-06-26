export function getEnv(name: string): string | undefined {
  const workerEnv = (globalThis as any)?.env?.[name];

  if (typeof workerEnv === "string") {
    return workerEnv;
  }

  return process.env?.[name];
}

export function requireEnv(name: string): string {
  const value = getEnv(name);

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}
