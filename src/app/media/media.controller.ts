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
		const mediaList = await this.mediaService.retrieveAll();
		return this.apiResponse.sendResponse(mediaList);
	}

	async upload(): Promise<Response> {
		const files = this.request.files as Express.Multer.File[];

		const uploadResult = await this.cloudinarySettings.multipleUpload(files);

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

		const result = await this.mediaService.updateMediaFileName(id, check.data.name);
		return this.apiResponse.sendResponse(result);
	}

	async delete(): Promise<Response> {
		const { params } = this.request;

		const id = Number(params.id);

		if (isNaN(id)) {
			return this.apiResponse.badResponse("Invalid media ID provided.");
		}

		const result = await this.mediaService.deleteMedia(id);
		return this.apiResponse.sendResponse(result);
	}
}
