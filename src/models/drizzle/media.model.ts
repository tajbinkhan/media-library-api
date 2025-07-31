import {
	bigint,
	decimal,
	integer,
	json,
	pgTable,
	serial,
	text,
	varchar
} from "drizzle-orm/pg-core";

import { timestamps } from "@/databases/drizzle/helpers";

export const media = pgTable("media", {
	id: serial("id").primaryKey(),

	// File identification
	filename: varchar("filename", { length: 255 }).notNull(),
	originalFilename: varchar("original_filename", { length: 255 }).notNull(),
	mimeType: varchar("mime_type", { length: 100 }).notNull(),
	fileExtension: varchar("file_extension", { length: 10 }).notNull(),
	secureUrl: text("secure_url"), // HTTPS URL (optional for some providers)

	// File properties
	fileSize: bigint("file_size", { mode: "number" }).notNull(), // in bytes
	width: integer("width"),
	height: integer("height"),
	duration: decimal("duration", { precision: 10, scale: 2 }), // for videos/audio in seconds

	// Unique storage information
	storageKey: text("storage_key").notNull(),

	// File type categorization
	mediaType: text("media_type").notNull(),

	// Organization
	altText: text("alt_text"),
	caption: text("caption"),
	description: text("description"),
	tags: json("tags"), // Array of tags for better organization

	// Storage specific metadata
	storageMetadata: json("storage_metadata"), // Provider-specific data (transformations, ACL, etc.)

	// Timestamps
	...timestamps
});
