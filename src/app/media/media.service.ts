import {
	Inject,
	Injectable,
	NotFoundException,
	UnprocessableEntityException,
} from '@nestjs/common';
import { and, count, eq, gte, ilike, lte } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PaginatedResponse } from '../../core/api-response.interceptor';
import PaginationManager from '../../core/pagination';
import { DATABASE_CONNECTION } from '../../database/connection';
import { orderByColumn } from '../../database/helpers';
import schema from '../../database/schema';
import DrizzleService from '../../database/service';
import { MediaDataType, MediaDeleteResponseType, MediaResponseType } from './@types/media.types';
import { MediaDto, MediaQuerySchemaType } from './media.schema';

@Injectable()
export class MediaService extends DrizzleService {
	constructor(
		@Inject(DATABASE_CONNECTION)
		db: NodePgDatabase<typeof schema>,
	) {
		super(db);
	}

	async uploadMedia(data: MediaDataType): Promise<boolean> {
		const createdMedia = await this.getDb()
			.insert(schema.media)
			.values(data)
			.returning()
			.then(res => res[0] || null);

		if (!createdMedia) throw new UnprocessableEntityException('Media could not be created');

		return !!createdMedia;
	}

	async getAllMedia(
		userId: number,
		filter: MediaQuerySchemaType,
	): Promise<PaginatedResponse<MediaResponseType>> {
		// Create date objects from string inputs if they exist
		const fromDate = filter.from ? new Date(filter.from) : undefined;
		const toDate = filter.to ? new Date(filter.to) : undefined;

		// If toDate exists, set it to the end of the day
		if (toDate) {
			toDate.setHours(23, 59, 59, 999);
		}

		const q = filter.search ? `%${filter.search}%` : undefined;

		/**
		 * Extended search:
		 * - Match "other user" in the contact (borrower OR lender), excluding myself
		 * - Match contact fields (description/publicId/amount/amountPaid)
		 *
		 * NOTE: We use casts for UUID/decimal fields so Postgres can ILIKE them.
		 */
		const searchExists = filter.search && q ? ilike(schema.media.filename, q) : undefined;

		const conditions = [
			searchExists,
			eq(schema.media.uploadedBy, userId),
			fromDate ? gte(schema.media.createdAt, fromDate) : undefined,
			toDate ? lte(schema.media.createdAt, toDate) : undefined,
		].filter(Boolean);

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		// Determine pagination parameters
		let pagination;
		let offset = 0;
		let totalItems = 0;

		if (filter.page && filter.limit) {
			// Get total count for pagination
			totalItems = await this.getDb()
				.select({
					count: count(),
				})
				.from(schema.media)
				.where(whereClause)
				.then(result => result[0].count);

			const paginationManager = new PaginationManager(filter.page, filter.limit, totalItems);
			const paginationResult = paginationManager.createPagination();
			pagination = paginationResult.pagination;
			offset = paginationResult.offset;
		}

		const mediaOrderBy = orderByColumn(schema.media, filter.sortBy, filter.sortOrder);

		// Determine which orderBy to use based on which table contains the field
		const orderBy = mediaOrderBy;

		// Build query with all possible combinations

		const baseSelect = this.getDb()
			.select({
				publicId: schema.media.publicId,
				filename: schema.media.filename,
				mimeType: schema.media.mimeType,
				fileSize: schema.media.fileSize,
				secureUrl: schema.media.secureUrl,
				mediaType: schema.media.mediaType,
				altText: schema.media.altText,
				width: schema.media.width,
				height: schema.media.height,
				tags: schema.media.tags,
				createdAt: schema.media.createdAt,
				updatedAt: schema.media.updatedAt,
			})
			.from(schema.media)
			.where(whereClause);

		let rawData;
		// Handle pagination and ordering
		if (filter.page && filter.limit) {
			// Paginated query
			if (offset && orderBy) {
				rawData = await baseSelect.limit(filter.limit).offset(offset).orderBy(orderBy);
			} else if (offset) {
				rawData = await baseSelect.limit(filter.limit).offset(offset);
			} else if (orderBy) {
				rawData = await baseSelect.limit(filter.limit).orderBy(orderBy);
			} else {
				rawData = await baseSelect.limit(filter.limit);
			}
		} else {
			// Non-paginated query
			if (orderBy) {
				rawData = await baseSelect.orderBy(orderBy);
			} else {
				rawData = await baseSelect;
			}
		}

		return {
			data: rawData,
			pagination,
		};
	}

	async getMediaByPublicId(userId: number, publicId: string): Promise<MediaResponseType> {
		const mediaItem = await this.getDb()
			.select({
				publicId: schema.media.publicId,
				filename: schema.media.filename,
				mimeType: schema.media.mimeType,
				fileSize: schema.media.fileSize,
				secureUrl: schema.media.secureUrl,
				mediaType: schema.media.mediaType,
				altText: schema.media.altText,
				width: schema.media.width,
				height: schema.media.height,
				tags: schema.media.tags,
				createdAt: schema.media.createdAt,
				updatedAt: schema.media.updatedAt,
			})
			.from(schema.media)
			.where(and(eq(schema.media.publicId, publicId), eq(schema.media.uploadedBy, userId)))
			.then(res => res[0] || null);

		if (!mediaItem) throw new NotFoundException('Media not found');

		return mediaItem;
	}

	async updateMediaData(userId: number, publicId: string, data: MediaDto): Promise<boolean> {
		const updatedMedia = await this.getDb()
			.update(schema.media)
			.set({
				altText: data.altText,
				filename: data.name,
			})
			.where(and(eq(schema.media.publicId, publicId), eq(schema.media.uploadedBy, userId)))
			.returning()
			.then(res => res[0] || null);

		if (!updatedMedia) throw new UnprocessableEntityException('Media could not be updated');

		return !!updatedMedia;
	}

	async deleteMedia(userId: number, publicId: string): Promise<MediaDeleteResponseType> {
		const deletedMedia = await this.getDb()
			.delete(schema.media)
			.where(and(eq(schema.media.publicId, publicId), eq(schema.media.uploadedBy, userId)))
			.returning()
			.then(res => res[0] || null);

		if (!deletedMedia) throw new UnprocessableEntityException('Media could not be deleted');

		return deletedMedia;
	}

	async restrictMediaUpload(userId: number): Promise<boolean> {
		const mediaCount = await this.getDb()
			.select()
			.from(schema.media)
			.where(eq(schema.media.uploadedBy, userId))
			.then(res => res.length);

		// Example restriction: limit to 5 media items per user
		const MAX_MEDIA_PER_USER = 5;

		if (mediaCount >= MAX_MEDIA_PER_USER) {
			throw new UnprocessableEntityException(
				`Media upload limit reached. Maximum allowed is ${MAX_MEDIA_PER_USER} items.`,
			);
		}

		return mediaCount < MAX_MEDIA_PER_USER;
	}
}
