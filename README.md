# Media Library API

A secure and scalable media management backend API built with NestJS, PostgreSQL, Drizzle ORM, and Cloudinary.

## Description

This is the backend API for a media library system, featuring secure authentication, media upload and management via Cloudinary, CSRF protection, and comprehensive user management. Built with modern technologies and best practices for production-ready applications.

## Features

- 📁 **Media Management** - Upload, retrieve, update, and delete media files
- ☁️ **Cloudinary Integration** - Cloud-based image and video storage with optimization
- 🔐 **Secure Authentication** - JWT-based authentication with session management
- 🛡️ **CSRF Protection** - Built-in CSRF token validation
- 🔑 **OAuth Integration** - Google OAuth 2.0 authentication support
- 📊 **Database ORM** - Drizzle ORM for type-safe database queries
- 🐘 **PostgreSQL** - Robust relational database with Docker support
- 🔒 **Password Encryption** - Bcrypt password hashing
- 🌐 **API Response Standardization** - Consistent response format across all endpoints
- 📝 **Request Logging** - Comprehensive request/response logging
- 🎯 **Device Tracking** - User agent and device information tracking

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** Passport.js (JWT & Google OAuth)
- **Security:** CSRF-CSRF, bcryptjs
- **Package Manager:** pnpm

## Prerequisites

- Node.js (v18 or higher)
- pnpm
- Docker (for PostgreSQL)

## Project Setup

1. **Install dependencies:**

```bash
pnpm install
```

2. **Configure environment variables:** Create a `.env` file in the root directory with the
   following variables:

```env
# Application
NODE_ENV=development
PORT=8080
COOKIE_DOMAIN=localhost
ORIGIN_URL=http://localhost:3000
API_URL=http://localhost:8080
APP_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://media_library:media_library@localhost:5666/media_library?schema=public"

# Security Secrets
AUTH_SECRET=your_auth_secret_here
CSRF_SECRET=your_csrf_secret_here
CRYPTO_SECRET=your_crypto_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Postgres Docker Configuration
POSTGRES_USER=media_library
POSTGRES_PASSWORD=media_library
POSTGRES_DB=media_library
```

3. **Start PostgreSQL with Docker:**

```bash
docker-compose up -d
```

4. **Generate and run database migrations:**

```bash
# Generate migration files
pnpm db:generate

# Push schema changes to database
pnpm db:push
```

## Running the Application

```bash
# Development mode with watch
pnpm dev

# Standard development mode
pnpm start

# Production mode
pnpm prod
```

The API will be available at `http://localhost:8080` (or your configured PORT).

## Database Management

```bash
# Open Drizzle Studio (database GUI)
pnpm db:studio

# Generate new migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema changes directly
pnpm db:push

# Clear database
pnpm db:clear
```

## Code Quality

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Build for production
pnpm build
```

## Project Structure

```
src/
├── app/
│   ├── auth/                 # Authentication module
│   │   ├── strategies/       # Passport strategies (JWT, Google)
│   │   ├── auth.service.ts   # Authentication logic
│   │   ├── auth.controller.ts
│   │   └── auth.guard.ts
│   └── media/                # Media management module
│       ├── media.controller.ts
│       ├── media.service.ts
│       ├── media.schema.ts
│       └── media.pipe.ts
├── core/                     # Core utilities
│   ├── cloudinary/          # Cloudinary integration
│   ├── crypto/              # Encryption services
│   ├── validators/          # Schema validators
│   └── constants.ts
├── csrf/                    # CSRF protection module
├── database/                # Database configuration
│   ├── schema.ts           # Database schema
│   └── connection.ts
└── models/
    └── drizzle/            # Drizzle ORM models
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with credentials
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/logout` - Logout user
- `GET /auth/profile` - Get user profile

### Media Management

- `POST /media` - Upload media file (protected)
- `GET /media` - Get all user's media (protected)
- `PUT /media/:id` - Update media metadata (protected)
- `DELETE /media/:id` - Delete media file (protected)

### CSRF

- `GET /csrf` - Get CSRF token

## Security Features

- JWT token-based authentication
- HTTP-only cookies for token storage
- CSRF token validation on state-changing requests
- Password hashing with bcrypt
- Session management with device tracking
- IP address and user agent logging
- Secure media upload with file validation
- Cloud-based storage via Cloudinary with access control

## Documentation

For additional documentation, see:

- [CSRF Implementation](docs/CSRF_IMPLEMENTATION.md)
- [Testing Removal Guide](docs/REMOVE_TESTING.md)

## License

UNLICENSED - Private project
