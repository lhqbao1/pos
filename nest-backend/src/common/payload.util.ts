export type WrappedPayload<T> = {
  data?: T;
};

export function unwrapData<T>(payload: WrappedPayload<T> | T): T {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'data' in payload &&
    (payload as WrappedPayload<T>).data !== undefined
  ) {
    return (payload as WrappedPayload<T>).data as T;
  }

  return payload as T;
}

export function wrapData<T>(data: T) {
  return { data };
}

export function wrapList<T>(data: T[]) {
  return {
    data,
    meta: {
      total: data.length,
    },
  };
}
