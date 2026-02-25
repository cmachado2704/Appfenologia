type PostSaveResetOptions<T extends Record<string, any>> = {
  keepFields?: (keyof T | string)[];
  initialState?: T;
};

export const handlePostSaveReset = <T extends Record<string, any>>(
  formState: T,
  setFormState: (next: T) => void,
  options?: PostSaveResetOptions<T>
) => {
  const keep = new Set((options?.keepFields || []).map(String));
  const base = options?.initialState ?? formState;

  const next = { ...base } as T;

  (Object.keys(base) as Array<keyof T>).forEach((key) => {
    if (keep.has(String(key))) {
      next[key] = formState[key];
    }
  });

  setFormState(next);
};
