// STUB: auth requests. No local data layer for this in packages/app yet, so it uses hardcoded stub data.
// Simulates a network round trip so the forms show their loading state, like the web mock calls.
export const stubRequest = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 800));
