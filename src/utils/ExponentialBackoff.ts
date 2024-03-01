export default async function exponentialBackoffDelay(
  exponentialBackoff: number
): Promise<number> {
  console.log(`Rate limited, retrying in ${exponentialBackoff} seconds...`);
  await new Promise((resolve) =>
    setTimeout(resolve, exponentialBackoff * 1000)
  );
  exponentialBackoff *= 2;

  return exponentialBackoff;
}
