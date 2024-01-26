export interface Progress {
  current: number;
  total: number;
  status: string;
  metadata?: any;
  currentDocumentUrl?: string;
}
