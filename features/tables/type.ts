export type TableType = "Normal" | "Vip";

export type TableStatus = "Empty" | "Using" | "Reserved" | "Cleaning" | "Disabled";

export interface Table {
  id: number;
  documentId?: string;
  tableNumber: string;
  displayName?: string;
  type: TableType;
  table_status: TableStatus;
  capacity?: number;
  zone?: string;
  note?: string;
  is_active?: boolean;
  occupied_since?: string | null;
  last_cleared_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface TablePayload {
  tableNumber: string;
  displayName?: string;
  type?: TableType;
  table_status?: TableStatus;
  capacity?: number;
  zone?: string;
  note?: string;
  is_active?: boolean;
  occupied_since?: string | null;
  last_cleared_at?: string | null;
}
