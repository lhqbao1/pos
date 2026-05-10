import axios from "axios";
import { TablePayload } from './type'

export const getTables = async (params?: Record <string, string | number>) => {
    const response = await axios.get('/api/tables', { params })
    return response.data
}

export const getTableByTableNumber = async (params?: Record<string, string | number>) => {
    const response = await axios.get('/api/tables', { params })
    return response.data
}

export const createTable = async (payload: TablePayload) => {
  const response = await axios.post('/api/tables', {
    data: payload,
  })
  return response.data
}

export const updateTableStatus = async ({
  table_id,
  table_status,
  occupied_since,
  last_cleared_at,
}: {
  table_id?: string;
  table_status?: string;
  occupied_since?: string | null;
  last_cleared_at?: string | null;
}) => {
  if (!table_id) {
    throw new Error("Không tìm thấy documentId của bàn để cập nhật trạng thái.");
  }

  const response = await axios.put(
    `/api/tables/${table_id}`,
    {
      data: {
        table_status: table_status,
        occupied_since: occupied_since,
        last_cleared_at: last_cleared_at,
      },
    }
  );
  return response.data;
};
