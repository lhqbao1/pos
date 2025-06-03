import axios from "axios"

export const getTables = async (params?: Record <string, string | number>) => {
    const response = await axios.get('http://localhost:1337/api/tables', {params})
    return response.data
}

export const getTableByTableNumber = async (params?: Record<string, string | number>) => {
    const response = await axios.get('http://localhost:1337/api/tables', {params})
    return response.data
}

export const updateTableStatus = async ({
  table_id,
  table_status,
}: {
  table_id?: string;
  table_status?: string;
}) => {
  const response = await axios.put(
    `http://localhost:1337/api/tables/${table_id}`,
    {
      data: {
        table_status: table_status,
      },
    }
  );
  return response.data;
};