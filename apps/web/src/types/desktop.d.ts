export {};
declare global {
  interface Window {
    hmxAPI?: {
      platform: string;
      versions?: { electron?: string; chrome?: string };
      openDataDir: () => Promise<{ ok: boolean; error?: string }>;
    };
  }
}
