import express from "express";

import { ALLOWED_FILE_TYPES, MAX_FILES, MAX_FILE_SIZE } from "@/app/media/media.constant";

import { ApiResponse } from "@/utils/serviceApi";

// File validation middleware
export const fileValidationMiddleware = (
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
) => {
	const files = req.files as Express.Multer.File[];

	const apiResponse = new ApiResponse(res);

	if (!files || files.length === 0) {
		return apiResponse.badResponse("No files uploaded");
	}

	// Check number of files
	if (files.length > MAX_FILES) {
		return apiResponse.badResponse(`Maximum ${MAX_FILES} files allowed per upload`);
	}

	// Validate each file
	for (const file of files) {
		// Check file size
		if (file.size > MAX_FILE_SIZE) {
			return apiResponse.badResponse(
				`File ${file.originalname} exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
			);
		}

		// Check file type
		if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
			return apiResponse.badResponse(
				`File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(", ")}`
			);
		}

		// Additional security checks
		if (!file.originalname || file.originalname.trim() === "") {
			return apiResponse.badResponse("File must have a valid name");
		}

		// Check for potentially dangerous file extensions
		const dangerousExtensions = [".exe", ".bat", ".cmd", ".com", ".pif", ".scr", ".vbs", ".js"];
		const fileExtension = file.originalname
			.toLowerCase()
			.substring(file.originalname.lastIndexOf("."));
		if (dangerousExtensions.includes(fileExtension)) {
			return apiResponse.badResponse(
				`File type ${fileExtension} is not allowed for security reasons`
			);
		}
	}

	next();
};
