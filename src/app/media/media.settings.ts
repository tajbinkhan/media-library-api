import type { UploadApiResponse } from "cloudinary";
import { v2 as cloudinary } from "cloudinary";
import { StatusCodes } from "http-status-codes";

import { type ServiceApiResponse, ServiceResponse } from "@/utils/serviceApi";

export interface UploadResult {
	success: boolean;
	data?: UploadApiResponse;
	error?: string;
	url?: string;
	public_id?: string;
}

export class CloudinarySettings {
	constructor() {
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
			api_key: process.env.CLOUDINARY_API_KEY,
			api_secret: process.env.CLOUDINARY_API_SECRET
		});
	}

	/**
	 * Upload a single file to Cloudinary
	 */
	async singleUpload(
		file: Express.Multer.File | Buffer | string
	): Promise<ServiceApiResponse<UploadApiResponse>> {
		try {
			if (typeof file === "string") {
				// URL upload
				const uploadData = await cloudinary.uploader.upload(file);
				return ServiceResponse.createResponse(StatusCodes.OK, "Upload successful", uploadData);
			}

			if (file instanceof Buffer) {
				// Direct buffer upload
				const uploadData = await this.uploadBuffer(file);
				return ServiceResponse.createResponse(StatusCodes.OK, "Upload successful", uploadData);
			}

			// Multer file upload
			const multerFile = file as Express.Multer.File;

			if (multerFile.buffer) {
				// Memory storage - pass file metadata
				const uploadData = await this.uploadBufferWithMetadata(multerFile.buffer, {
					originalname: multerFile.originalname,
					mimetype: multerFile.mimetype,
					size: multerFile.size,
					fieldname: multerFile.fieldname,
					encoding: multerFile.encoding
				});
				return ServiceResponse.createResponse(StatusCodes.OK, "Upload successful", uploadData);
			}

			if (multerFile.path) {
				// Disk storage - pass file metadata
				const uploadOptions = {
					context: {
						original_filename: multerFile.originalname,
						mime_type: multerFile.mimetype,
						file_size: multerFile.size.toString(),
						field_name: multerFile.fieldname,
						encoding: multerFile.encoding
					}
				};
				const uploadData = await cloudinary.uploader.upload(multerFile.path, uploadOptions);
				return ServiceResponse.createResponse(StatusCodes.OK, "Upload successful", uploadData);
			}

			return ServiceResponse.createRejectResponse(
				StatusCodes.BAD_REQUEST,
				"Invalid file - no buffer or path found"
			);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	/**
	 * Helper method to upload buffer to Cloudinary (without metadata)
	 */
	private uploadBuffer(buffer: Buffer): Promise<UploadApiResponse> {
		return new Promise((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream({}, (error, result) => {
				if (error) {
					reject(error);
				} else if (result) {
					resolve(result);
				} else {
					reject(new Error("Upload failed - no result returned"));
				}
			});
			uploadStream.end(buffer);
		});
	}

	/**
	 * Helper method to upload buffer with metadata to Cloudinary
	 */
	private uploadBufferWithMetadata(
		buffer: Buffer,
		fileMetadata: {
			originalname: string;
			mimetype: string;
			size: number;
			fieldname: string;
			encoding: string;
		}
	): Promise<UploadApiResponse> {
		return new Promise((resolve, reject) => {
			const uploadOptions = {
				// Store original filename and metadata in context
				context: {
					original_filename: fileMetadata.originalname,
					mime_type: fileMetadata.mimetype,
					file_size: fileMetadata.size.toString(),
					field_name: fileMetadata.fieldname,
					encoding: fileMetadata.encoding
				},
				// You can also use tags for organization
				tags: ["uploaded_file"]
				// Or use public_id to include original filename (sanitized)
				// public_id: this.sanitizeFilename(fileMetadata.originalname)
			};

			const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
				if (error) {
					reject(error);
				} else if (result) {
					resolve(result);
				} else {
					reject(new Error("Upload failed - no result returned"));
				}
			});
			uploadStream.end(buffer);
		});
	}

	/**
	 * Sanitize filename for use as public_id
	 */
	private sanitizeFilename(filename: string): string {
		// Remove extension and sanitize for Cloudinary public_id
		const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
		return nameWithoutExt
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "_") // Replace non-alphanumeric with underscore
			.replace(/_+/g, "_") // Replace multiple underscores with single
			.replace(/^_|_$/g, ""); // Remove leading/trailing underscores
	}

	/**
	 * Upload multiple files to Cloudinary
	 */
	async multipleUpload(
		files: (Express.Multer.File | Buffer | string)[]
	): Promise<ServiceApiResponse<UploadApiResponse[]>> {
		try {
			const uploadPromises = files.map(file => this.singleUpload(file));
			const results = await Promise.allSettled(uploadPromises);

			const successful: UploadApiResponse[] = [];
			const errors: string[] = [];

			results.forEach((result, index) => {
				if (result.status === "fulfilled" && result.value.data) {
					successful.push(result.value.data);
				} else {
					errors.push(
						`File ${index + 1}: ${result.status === "rejected" ? result.reason : "Upload failed"}`
					);
				}
			});

			if (errors.length > 0 && successful.length === 0) {
				return ServiceResponse.createRejectResponse(
					StatusCodes.BAD_REQUEST,
					`All uploads failed: ${errors.join(", ")}`
				);
			}

			return ServiceResponse.createResponse(
				StatusCodes.OK,
				`Upload successful (${successful.length}/${files.length} files)`,
				successful
			);
		} catch (error) {
			return ServiceResponse.createErrorResponse(error);
		}
	}

	/**
	 * Delete a file from Cloudinary
	 */
	async deleteFile(public_id: string): Promise<boolean> {
		try {
			const result = await cloudinary.uploader.destroy(public_id);
			return result.result === "ok";
		} catch (error) {
			console.error("Error deleting file from Cloudinary:", error);
			return false;
		}
	}
}
