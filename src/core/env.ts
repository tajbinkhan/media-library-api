import { z } from 'zod';

import { validateEnum, validateString } from './validators/commonRules';

const allSecretsEnvSchema = z.object({
	AUTH_SECRET: validateString('AUTH_SECRET'),
	CSRF_SECRET: validateString('CSRF_SECRET'),
	CRYPTO_SECRET: validateString('CRYPTO_SECRET'),
});

const googleEnvSchema = z.object({
	GOOGLE_CLIENT_ID: validateString('GOOGLE_CLIENT_ID'),
	GOOGLE_CLIENT_SECRET: validateString('GOOGLE_CLIENT_SECRET'),
	GOOGLE_CALLBACK_URL: validateString('GOOGLE_CALLBACK_URL'),
});

const cloudinaryEnvSchema = z.object({
	CLOUDINARY_CLOUD_NAME: validateString('CLOUDINARY_CLOUD_NAME'),
	CLOUDINARY_API_KEY: validateString('CLOUDINARY_API_KEY'),
	CLOUDINARY_API_SECRET: validateString('CLOUDINARY_API_SECRET'),
});

export const envSchema = z.object({
	DATABASE_URL: validateString('DATABASE_URL'),
	PORT: validateString('PORT').refine(value => !isNaN(Number(value)), 'PORT must be a number'),
	NODE_ENV: validateEnum('NODE_ENV', ['development', 'production']).default('development'),
	COOKIE_DOMAIN: validateString('COOKIE_DOMAIN'),
	ORIGIN_URL: validateString('ORIGIN_URL'),
	API_URL: validateString('API_URL'),
	APP_URL: validateString('APP_URL'),
	...allSecretsEnvSchema.shape,
	...googleEnvSchema.shape,
	...cloudinaryEnvSchema.shape,
});

export type EnvType = z.infer<typeof envSchema>;

// NestJS ConfigModule validation function
export function validateEnv(config: Record<string, unknown>): EnvType {
	const result = envSchema.safeParse(config);

	if (!result.success) {
		const errorMessages = result.error.issues.map(e => e.message).join('\n');
		console.error(`\x1b[31mEnvironment validation failed:\n${errorMessages}\x1b[0m`);
		throw new Error('Environment validation failed');
	}

	return result.data;
}
