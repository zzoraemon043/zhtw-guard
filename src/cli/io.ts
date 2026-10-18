export interface CliIo {
  cwd: string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  readStdin: () => Promise<Uint8Array>;
}

export const EXIT_CLEAN = 0;
export const EXIT_PROBLEMS = 1;
export const EXIT_USAGE = 2;

export const EXIT_HOOK_ERROR = 1;
export const EXIT_HOOK_BLOCK = 2;

export class UsageError extends Error {}
