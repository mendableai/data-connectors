export default async function rateLimitDelay(
  exponentialBackoff: number
): Promise<void> {
  console.log(`Rate limited, retrying in ${exponentialBackoff} seconds...`);
  await new Promise((resolve) =>
    setTimeout(resolve, exponentialBackoff * 1000)
  );
}
