export type MigrationWarning = {
  message: string;
  nodeName?: string;
};

export type FileMigrationResult = {
  filePath: string;
  changed: boolean;
  code: string;
  warnings: MigrationWarning[];
};

export type MigrationSummary = {
  filesScanned: number;
  filesChanged: number;
  warnings: number;
};

export type CliOptions = {
  targets: string[];
  write: boolean;
  include: string[];
  exclude: string[];
  extensions: string[];
  reportPath?: string;
};

export type MigrationReport = {
  summary: MigrationSummary;
  files: Array<{
    filePath: string;
    changed: boolean;
    warnings: MigrationWarning[];
  }>;
};
