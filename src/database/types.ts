import type { InferSelectModel } from 'drizzle-orm';
import { accounts, sessions, users } from '../models/drizzle/auth.model';
import { media } from '../models/drizzle/media.model';

export type UserSchemaType = InferSelectModel<typeof users>;
export type AccountSchemaType = InferSelectModel<typeof accounts>;
export type SessionSchemaType = InferSelectModel<typeof sessions>;
export type MediaSchemaType = InferSelectModel<typeof media>;

/**
 * Enum Schema Types
 */
