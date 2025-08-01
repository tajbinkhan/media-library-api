import type { UploadApiResponse } from "cloudinary";
import { v2 as cloudinary } from "cloudinary";
import { StatusCodes } from "http-status-codes";

import { ALLOWED_FILE_TYPES } from "@/app/media/media.constant";

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
			// Validate file input
			if (!file) {
				return ServiceResponse.createRejectResponse(
					StatusCodes.BAD_REQUEST,
					"No file provided for upload"
				);
			}

			if (typeof file === "string") {
				// URL upload with validation
				if (!this.isValidUrl(file)) {
					return ServiceResponse.createRejectResponse(
						StatusCodes.BAD_REQUEST,
						"Invalid URL provided for upload"
					);
				}
				// Use auto-detection for URL uploads since we can't determine mimetype beforehand
				const uploadData = await cloudinary.uploader.upload(file, { resource_type: "auto" });
				return ServiceResponse.createResponse(StatusCodes.OK, "Upload successful", uploadData);
			}

			if (file instanceof Buffer) {
				// Direct buffer upload with validation
				if (file.length === 0) {
					return ServiceResponse.createRejectResponse(
						StatusCodes.BAD_REQUEST,
						"Empty buffer provided for upload"
					);
				}
				// Use "raw" as default resource type for direct buffer uploads since we don't have mimetype
				const uploadData = await this.uploadBuffer(file);
				return ServiceResponse.createResponse(StatusCodes.OK, "Upload successful", uploadData);
			}

			// Multer file upload
			const multerFile = file as Express.Multer.File;

			// Validate multer file
			if (!this.isValidMulterFile(multerFile)) {
				return ServiceResponse.createRejectResponse(
					StatusCodes.BAD_REQUEST,
					"Invalid file format or corrupted file"
				);
			}

			if (multerFile.buffer) {
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
				const uploadOptions = {
					// Determine resource type based on file type
					resource_type: this.getResourceType(multerFile.mimetype),
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
		} catch (error: any) {
			// Handle specific Cloudinary errors
			if (error.message?.includes("Invalid image file") || error.http_code === 400) {
				return ServiceResponse.createRejectResponse(
					StatusCodes.BAD_REQUEST,
					"Invalid file format. This file type may not be supported or the file may be corrupted. Please try uploading a different file."
				);
			}

			if (error.message?.includes("File size too large")) {
				return ServiceResponse.createRejectResponse(
					StatusCodes.BAD_REQUEST,
					"File size exceeds the maximum allowed limit."
				);
			}

			// Log the full error for debugging but return a generic message
			return ServiceResponse.createRejectResponse(
				StatusCodes.INTERNAL_SERVER_ERROR,
				"Upload service temporarily unavailable. Please try again later."
			);
		}
	}

	/**
	 * Helper method to upload buffer to Cloudinary (without metadata)
	 */
	private uploadBuffer(buffer: Buffer, mimetype?: string): Promise<UploadApiResponse> {
		return new Promise((resolve, reject) => {
			try {
				const uploadOptions = {
					resource_type: mimetype ? this.getResourceType(mimetype) : "auto"
				};

				const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
					if (error) {
						// Handle specific Cloudinary errors
						if (error.message?.includes("Invalid image file") || error.http_code === 400) {
							reject(new Error("Invalid file format. Please upload a valid file."));
						} else {
							reject(new Error("Upload service temporarily unavailable."));
						}
					} else if (result) {
						resolve(result);
					} else {
						reject(new Error("Upload failed - no result returned"));
					}
				});
				uploadStream.end(buffer);
			} catch (error) {
				reject(new Error("Failed to initialize upload process"));
			}
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
			try {
				const uploadOptions = {
					// Determine resource type based on file type
					resource_type: this.getResourceType(fileMetadata.mimetype),
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
						// Handle specific Cloudinary errors
						if (error.message?.includes("Invalid image file") || error.http_code === 400) {
							reject(new Error("Invalid file format. Please upload a valid file."));
						} else {
							reject(new Error("Upload service temporarily unavailable."));
						}
					} else if (result) {
						resolve(result);
					} else {
						reject(new Error("Upload failed - no result returned"));
					}
				});
				uploadStream.end(buffer);
			} catch (error) {
				reject(new Error("Failed to initialize upload process"));
			}
		});
	}

	/**
	 * Upload multiple files to Cloudinary
	 */
	async multipleUpload(
		files: (Express.Multer.File | Buffer | string)[]
	): Promise<ServiceApiResponse<UploadApiResponse[]>> {
		try {
			if (!files || files.length === 0) {
				return ServiceResponse.createRejectResponse(
					StatusCodes.BAD_REQUEST,
					"No files provided for upload"
				);
			}

			const uploadPromises = files.map(file => this.singleUpload(file));
			const results = await Promise.allSettled(uploadPromises);

			const successful: UploadApiResponse[] = [];
			const errors: string[] = [];

			results.forEach((result, index) => {
				if (result.status === "fulfilled") {
					// Check if the individual upload was successful
					if (result.value.status >= 200 && result.value.status < 300 && result.value.data) {
						successful.push(result.value.data);
					} else {
						errors.push(`File ${index + 1}: ${result.value.message || "Upload failed"}`);
					}
				} else {
					errors.push(`File ${index + 1}: ${result.reason?.message || "Upload failed"}`);
				}
			});

			// If no files were successfully uploaded
			if (successful.length === 0) {
				return ServiceResponse.createRejectResponse(
					StatusCodes.BAD_REQUEST,
					`All uploads failed: ${errors.join(", ")}`
				);
			}

			// If some files failed but at least one succeeded
			if (errors.length > 0) {
				console.warn("Some files failed to upload:", errors);
			}

			return ServiceResponse.createResponse(
				StatusCodes.OK,
				`Upload successful (${successful.length}/${files.length} files)`,
				successful
			);
		} catch (error) {
			return ServiceResponse.createRejectResponse(
				StatusCodes.INTERNAL_SERVER_ERROR,
				"Upload service temporarily unavailable. Please try again later."
			);
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
			return false;
		}
	}

	/**
	 * Validate if a string is a valid URL
	 */
	private isValidUrl(string: string): boolean {
		try {
			new URL(string);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Validate if a multer file is valid for upload
	 */
	private isValidMulterFile(file: Express.Multer.File): boolean {
		if (!file) return false;

		// Check if file has content (either buffer or path)
		if (!file.buffer && !file.path) return false;

		// Check if file has basic metadata
		if (!file.originalname || !file.mimetype) return false;

		// Check file size (not zero and not excessively large - 50MB limit)
		if (!file.size || file.size === 0 || file.size > 50 * 1024 * 1024) return false;

		return ALLOWED_FILE_TYPES.includes(file.mimetype.toLowerCase());
	}

	/**
	 * Determine the appropriate Cloudinary resource type based on MIME type
	 */
	private getResourceType(mimetype: string): "image" | "video" | "raw" | "auto" {
		const type = mimetype.toLowerCase();

		if (type.startsWith("image/")) {
			return "image";
		}

		if (type.startsWith("video/")) {
			return "video";
		}

		// For documents, text files, and other non-media files
		if (type.startsWith("text/") || type.startsWith("application/") || type.startsWith("audio/")) {
			return "raw";
		}

		// Let Cloudinary auto-detect for unknown types

		return "auto";
	}
}
