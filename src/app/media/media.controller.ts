import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import MediaService from "@/app/media/media.service";
import { CloudinarySettings } from "@/app/media/media.settings";
import { mediaNameSchema } from "@/app/media/media.validators";

import { ApiController } from "@/core/controller";

export default class MediaController extends ApiController {
	protected readonly cloudinarySettings: CloudinarySettings;
	protected readonly mediaService: MediaService;

	constructor(request: Request, response: Response) {
		super(request, response);
		this.cloudinarySettings = new CloudinarySettings();
		this.mediaService = new MediaService();
	}

	async index(): Promise<Response> {
		const mediaList = await this.mediaService.retrieveAll();
		return this.apiResponse.sendResponse(mediaList);
	}

	async upload(): Promise<Response> {
		const files = this.request.files as Express.Multer.File[];

		// Validate files exist
		if (!files || files.length === 0) {
			return this.apiResponse.badResponse("No files provided for upload.");
		}

		const uploadResult = await this.cloudinarySettings.multipleUpload(files);

		// Check if upload was successful (status 200-299 range)
		if (
			uploadResult.status < 200 ||
			uploadResult.status >= 300 ||
			!uploadResult.data ||
			uploadResult.data.length === 0
		) {
			return this.apiResponse.badResponse(
				uploadResult.message || "Upload failed - no data returned"
			);
		}

		const payload: CloudinaryUploadResponse = {
			...uploadResult.data[0],
			original_filename: files[0].originalname,
			asset_id: uploadResult.data[0].asset_id,
			version_id: uploadResult.data[0].version_id,
			asset_folder: uploadResult.data[0].asset_folder,
			display_name: uploadResult.data[0].display_name,
			api_key: uploadResult.data[0].api_key
		};

		const result = await this.mediaService.upload(payload);

		return this.apiResponse.sendResponse(result);
	}

	async updateFileName(): Promise<Response> {
		const { body, params } = this.request;

		const publicId = params.publicId;

		if (!publicId) {
			return this.apiResponse.badResponse("Invalid media public ID provided.");
		}

		const check = mediaNameSchema.safeParse(body);
		if (!check.success) {
			return this.apiResponse.badResponse(
				check.error.issues.map(issue => issue.message).join(", ")
			);
		}

		const result = await this.mediaService.updateMediaFileName(
			publicId,
			check.data.name,
			check.data.altText
		);
		return this.apiResponse.sendResponse(result);
	}

	async download(): Promise<Response> {
		const { params, query } = this.request;

		const publicId = params.publicId;

		if (!publicId) {
			return this.apiResponse.badResponse("Invalid media public ID provided.");
		}

		const result = await this.mediaService.downloadMedia(publicId);

		const mediaItem = result.data;

		// Ensure secureUrl exists
		if (!mediaItem.secureUrl) {
			return this.apiResponse.internalServerError("Media URL not available");
		}

		// Set appropriate headers for file download
		this.response.setHeader("Content-Type", mediaItem.mimeType);
		this.response.setHeader(
			"Content-Disposition",
			`attachment; filename="${mediaItem.originalFilename}"`
		);

		// If the media has file size information, set Content-Length
		if (mediaItem.fileSize) {
			this.response.setHeader("Content-Length", mediaItem.fileSize.toString());
		}

		// Add cache headers for better performance
		this.response.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
		this.response.setHeader("ETag", `"${mediaItem.id}-${mediaItem.updatedAt}"`);

		// Check if user wants to stream through server for better access control
		// Default behavior is to redirect for better performance
		const streamThroughServer = query.stream === "true";

		if (streamThroughServer) {
			// Note: Streaming through server provides better access control but uses more server resources
			// For production use, consider implementing proper streaming with progress tracking
			return this.apiResponse.sendResponse({
				status: StatusCodes.OK,
				message: "Streaming not implemented in this version. Use direct download.",
				data: { downloadUrl: mediaItem.secureUrl }
			});
		} else {
			// Redirect directly to Cloudinary (more efficient, less server load)
			// This is the recommended approach for most use cases
			this.response.redirect(StatusCodes.TEMPORARY_REDIRECT, mediaItem.secureUrl);
			return this.response;
		}
	}

	async delete(): Promise<Response> {
		const { params } = this.request;

		const publicId = params.publicId;

		if (!publicId) {
			return this.apiResponse.badResponse("Invalid media public ID provided.");
		}

		const result = await this.mediaService.deleteMedia(publicId);
		return this.apiResponse.sendResponse(result);
	}
}
