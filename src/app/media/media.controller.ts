import type { Request, Response } from "express";

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
		try {
			const mediaList = await this.mediaService.retrieveAll();
			return this.apiResponse.sendResponse(mediaList);
		} catch (error) {
			console.error("Error in index controller:", error);
			return this.apiResponse.internalServerError(
				"Failed to retrieve media list due to an internal error."
			);
		}
	}

	async upload(): Promise<Response> {
		try {
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
		} catch (error) {
			console.error("Error in upload controller:", error);
			return this.apiResponse.internalServerError("Upload failed due to an internal error.");
		}
	}

	async updateFileName(): Promise<Response> {
		try {
			const { body, params } = this.request;

			const id = Number(params.id);

			if (isNaN(id)) {
				return this.apiResponse.badResponse("Invalid media ID provided.");
			}

			const check = mediaNameSchema.safeParse(body);
			if (!check.success) {
				return this.apiResponse.badResponse(
					check.error.issues.map(issue => issue.message).join(", ")
				);
			}

			const result = await this.mediaService.updateMediaFileName(
				id,
				check.data.name,
				check.data.altText
			);
			return this.apiResponse.sendResponse(result);
		} catch (error) {
			console.error("Error in updateFileName controller:", error);
			return this.apiResponse.internalServerError(
				"Failed to update filename due to an internal error."
			);
		}
	}

	async delete(): Promise<Response> {
		try {
			const { params } = this.request;

			const id = Number(params.id);

			if (isNaN(id)) {
				return this.apiResponse.badResponse("Invalid media ID provided.");
			}

			const result = await this.mediaService.deleteMedia(id);
			return this.apiResponse.sendResponse(result);
		} catch (error) {
			console.error("Error in delete controller:", error);
			return this.apiResponse.internalServerError(
				"Failed to delete media due to an internal error."
			);
		}
	}
}
