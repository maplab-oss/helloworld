# CRUD

The goal is to define our model's fields once and derive every CRUD shape from that single source of truth. This avoids duplication, keeps read/write/update logic perfectly in sync, and ensures both TypeScript and Zod validate data consistently at every layer. Defaults, required fields, and read-only metadata all fall out naturally without needing separate hand-written schemas.

```ts
// basicFields.ts

export const basicFields = z.object({
  _id: z.string().default(() => crypto.randomUUID()),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  deletedAt: z.date().nullable().default(null),
});

export const createBasicFields = () => ({
  _id: crypto.randomUUID(),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});
```

```ts
// book.ts

export const bookBaseSchema = basicFields.extend({
  title: z.string(),
  author: z.string(),
  price: z.number().default(0),
  tags: z.array(z.string()).default([]),
});

export const bookCreateSchema = bookBaseSchema.omit({
  _id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const bookUpdateSchema = bookCreateSchema.partial();
export const bookReadSchema = bookBaseSchema
export type BookBase = z.infer<typeof bookBaseSchema>;
export type BookCreate = z.input<typeof bookCreateSchema>;
export type BookUpdate = z.input<typeof bookUpdateSchema>;
export type BookRead = z.infer<typeof bookReadSchema>;

export const createBook = (data: BookCreate): BookBase => {
  return bookBaseSchema.parse({
    ...bookCreateSchema.parse(data),
    ...createBasicFields(),
  });
};
```
