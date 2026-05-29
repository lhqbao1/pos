export type RelationInput =
  | string
  | number
  | null
  | undefined
  | {
      id?: number | string;
      documentId?: string;
    };

export function pickRelationRef(input?: RelationInput): string | number | undefined {
  if (input === null || input === undefined) {
    return undefined;
  }

  if (typeof input === 'string' || typeof input === 'number') {
    return input;
  }

  if (input.documentId) {
    return input.documentId;
  }

  return input.id;
}
