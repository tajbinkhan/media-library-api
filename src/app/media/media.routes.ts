import express, { Router } from "express";
import multer from "multer";

import { ALLOWED_FILE_TYPES, MAX_FILES, MAX_FILE_SIZE } from "@/app/media/media.constant";
import MediaController from "@/app/media/media.controller";
import { fileValidationMiddleware } from "@/app/media/media.validations";

import { asyncErrorHandler } from "@/settings/errorHandler";

const upload = multer({
	limits: {
		fileSize: MAX_FILE_SIZE,
		files: MAX_FILES
	},
	fileFilter: (req, file, cb) => {
		if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error(`File type ${file.mimetype} is not allowed`));
		}
	}
});

export const mediaRouter: Router = (() => {
	const router = express.Router();

	router.get(
		"",
		asyncErrorHandler(async (req, res) => {
			await new MediaController(req, res).index();
		})
	);

	// Upload routes
	router.post(
		"/upload",
		upload.any(),
		fileValidationMiddleware,
		asyncErrorHandler(async (req, res) => {
			await new MediaController(req, res).upload();
		})
	);

	router
		.route("/:id")
		.put(
			asyncErrorHandler(async (req, res) => {
				await new MediaController(req, res).updateFileName();
			})
		)
		.delete(
			asyncErrorHandler(async (req, res) => {
				await new MediaController(req, res).delete();
			})
		);

	return router;
})();
