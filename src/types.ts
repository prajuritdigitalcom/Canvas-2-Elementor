export interface KeyStatus {
  index: number;
  maskedKey: string;
  source: 'user' | 'server';
  status: 'idle' | 'in_use' | 'success' | 'rate_limited' | 'invalid' | 'error' | 'timeout';
  lastError?: string;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  details?: string[];
}

export interface ValidationResult {
  isValidDocStructure: boolean;
  isTailwindCdnRemoved: boolean;
  isTailwindConfigRemoved: boolean;
  detectedPrefix: string | null;
  unprefixedIds: string[];
  isJsProtected: boolean;
  issues: ValidationIssue[];
}

export interface ConvertRequest {
  rawHtml: string;
  userKeys?: string[];
  preferredModel?: string;
}

export interface ConvertResponse {
  success: boolean;
  html?: string;
  error?: string;
  keyIndexUsed?: number;
  durationMs?: number;
  keyStatuses?: KeyStatus[];
  validation?: ValidationResult;
  usedSource?: 'user' | 'server';
}

export interface ConversionHistoryItem {
  id: string;
  timestamp: string;
  title: string;
  detectedPrefix: string;
  rawLength: number;
  outputLength: number;
  rawHtml: string;
  outputHtml: string;
  validation: ValidationResult;
}
