import z from 'zod';
import { baseQuerySchema, SortableField } from '../../core/validators/baseQuery.schema';
import { validateString } from '../../core/validators/commonRules';

const MEDIA_SORTABLE_FIELDS: readonly SortableField[] = [
	{ name: 'id', queryName: 'id' },
	{ name: 'filename', queryName: 'filename' },
	{ name: 'fileSize', queryName: 'fileSize' },
	{ name: 'createdAt', queryName: 'createdAt' },
] as const;

export const mediaQuerySchema = baseQuerySchema(MEDIA_SORTABLE_FIELDS);

export const mediaSchema = z.object({
	name: validateString('Media Name'),
	altText: validateString('Media Alt Text'),
});

export type MediaDto = z.infer<typeof mediaSchema>;
export type MediaQuerySchemaType = z.infer<typeof mediaQuerySchema>;
