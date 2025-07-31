import express, { Router } from "express";

import AuthenticationController from "@/app/authentication/authentication.controller";

import { authenticationMiddleware } from "@/middlewares/authentication.middleware";
import { asyncErrorHandler } from "@/settings/errorHandler";

export const authenticationRouter: Router = (() => {
	const router = express.Router();

	// Get user information
	router.get(
		"/me",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).getSession();
		})
	);

	// Verify login OTP route
	router.post(
		"/verify-otp",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).verifyOTP();
		})
	);

	// User login route
	router.post(
		"/login",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).login();
		})
	);

	// Password reset request route
	router.post(
		"/reset-password/request",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).resetPasswordOTPRequest();
		})
	);

	// Password reset confirmation route
	router.post(
		"/reset-password/confirm",
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).resetPasswordConfirm();
		})
	);

	// Logout route
	router.post(
		"/logout",
		authenticationMiddleware,
		asyncErrorHandler(async (req, res) => {
			await new AuthenticationController(req, res).logout();
		})
	);

	return router;
})();
