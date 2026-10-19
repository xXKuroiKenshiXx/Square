export type FileInfo = {
  path: string;
  name: string;
  ext: string;
  bytes: number;
  targets: string[];
};
export type QuickSettings = {
  shortcut: string;
  enabled: boolean;
  registered: boolean;
  error: string | null;
  platform: string;
};
