import pc from "picocolors";
import { z } from "zod";

import { validateBoolean, validateEnum, validateString } from "@/validators/commonRules";

export const envSchema = z.object({
	DATABASE_URL: validateString("DATABASE_URL"),
	PORT: validateString("PORT").refine(value => !isNaN(Number(value)), "PORT must be a number"),
	SECRET: validateString("SECRET"),
	NODE_ENV: validateEnum("NODE_ENV", ["development", "production"]),
	SESSION_COOKIE_NAME: validateString("SESSION_COOKIE_NAME"),
	ORIGIN_URL: validateString("ORIGIN_URL"),
	COOKIE_SETTINGS: validateEnum("COOKIE_SETTINGS", ["locally", "globally"]),
	COOKIE_DOMAIN: validateString("COOKIE_DOMAIN"),
	COOKIE_SAME_SITE: validateEnum("COOKIE_SAME_SITE", ["lax", "strict", "none"]),
	OTP_RESET_EXPIRY: validateString("OTP_RESET_EXPIRY").refine(
		value => !isNaN(Number(value)),
		"OTP_RESET_EXPIRY must be a number"
	),
	SHOW_OTP: validateString("SHOW_OTP").refine(value =>
		validateBoolean(value) ? true : "SHOW_OTP must be a boolean value (true or false)"
	),
	API_URL: validateString("API_URL"),
	CLOUDINARY_CLOUD_NAME: validateString("CLOUDINARY_CLOUD_NAME"),
	CLOUDINARY_API_KEY: validateString("CLOUDINARY_API_KEY"),
	CLOUDINARY_API_SECRET: validateString("CLOUDINARY_API_SECRET")
});

const Env = envSchema.safeParse(process.env);

if (!Env.success) {
	const errorMessages = Env.error.issues.map(e => e.message).join("\n");
	console.error(pc.red(`Environment validation failed:\n${errorMessages}`));
	process.exit(1);
}

export type EnvType = z.infer<typeof envSchema>;

declare global {
	namespace NodeJS {
		interface ProcessEnv extends EnvType {}
	}
}
