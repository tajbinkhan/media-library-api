import { eq } from "drizzle-orm";
import { StatusCodes } from "http-status-codes";

import { CloudinarySettings } from "./media.settings";
import DrizzleService from "@/databases/drizzle/service";
import type { MediaSchemaType } from "@/databases/drizzle/types";
import { media } from "@/models/drizzle/media.model";
import { type ServiceApiResponse, ServiceResponse } from "@/utils/serviceApi";

export default class MediaService extends DrizzleService {
	private cloudinarySettings: CloudinarySettings;

	constructor() {
		super();
		this.cloudinarySettings = new CloudinarySettings();
	}

	async upload(data: CloudinaryUploadResponse): Promise<ServiceApiResponse<boolean>> {
		try {
			// Extract file extension from original filename if format is not provided
			const getFileExtension = (filename: string, format: string | undefined): string => {
				if (format) return format;
				const lastDotIndex = filename.lastIndexOf(".");
				return lastDotIndex !== -1 ? filename.substring(lastDotIndex + 1) : "";
			};

			// Determine mime type properly
			const getMimeType = (
				resourceType: string,
				format: string | undefined,
				originalMimeType?: string
			): string => {
				if (originalMimeType) return originalMimeType;
				if (format) return `${resourceType}/${format}`;
				return "application/octet-stream"; // fallback
			};

			const fileExtension = getFileExtension(data.original_filename, data.format);
			const mimeType = getMimeType(
				data.resource_type,
				data.format,
				data.context?.custom?.mime_type
			);

			await this.getDb()
				.insert(media)
				.values({
					filename: data.display_name,
					originalFilename: data.original_filename,
					mediaType: data.resource_type,
					fileSize: data.bytes,
					fileExtension: fileExtension,
					mimeType: mimeType,
					storageKey: data.public_id,
					height: data.height,
					width: data.width,
					secureUrl: data.secure_url,
					storageMetadata: data,
					altText: data.original_filename || ""
				});

			return ServiceResponse.createResponse(StatusCodes.OK, "Media uploaded successfully", true);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async retrieveAll(): Promise<ServiceApiResponse<MediaSchemaType[]>> {
		try {
			const mediaList = await this.getDb().query.media.findMany({
				orderBy: (media, { desc }) => desc(media.createdAt)
			});

			return ServiceResponse.createResponse(
				StatusCodes.OK,
				"Media retrieved successfully",
				mediaList
			);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async updateMediaFileName(
		id: number,
		name: string,
		altText?: string
	): Promise<ServiceApiResponse<boolean>> {
		try {
			await this.getDb()
				.update(media)
				.set({ originalFilename: name, altText })
				.where(eq(media.id, id));

			return ServiceResponse.createResponse(StatusCodes.OK, "Media file name updated", true);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	async deleteMedia(id: number): Promise<ServiceApiResponse<boolean>> {
		try {
			const mediaItem = await this.getDb().query.media.findFirst({
				where: eq(media.id, id)
			});

			if (!mediaItem) {
				return ServiceResponse.createRejectResponse(StatusCodes.NOT_FOUND, "Media item not found");
			}

			await this.cloudinarySettings.deleteFile(mediaItem.storageKey);

			await this.getDb().delete(media).where(eq(media.id, id));

			return ServiceResponse.createResponse(StatusCodes.OK, "Media deleted successfully", true);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}
}
