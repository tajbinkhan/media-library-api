import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscoveryModule } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthModule } from './app/auth/auth.module';
import { CryptoModule } from './core/crypto/crypto.module';
import { validateEnv } from './core/env';
import { CsrfModule } from './csrf/csrf.module';
import { DatabaseModule } from './database/database.module';
import { MediaModule } from './app/media/media.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate: validateEnv,
		}),
		DiscoveryModule,
		CryptoModule,
		CsrfModule,
		DatabaseModule,
		AuthModule,
		MediaModule,
	],
	controllers: [AppController],
})
export class AppModule {}
