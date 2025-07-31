# Media Library API

A full-stack, modular, and scalable media library API for healthcare applications. Built with
Node.js, Express, TypeScript, Drizzle ORM, and PostgreSQL. Includes authentication, session
management, media handling, and robust validation.

## Features

- Modular architecture (authentication, media, core, etc.)
- RESTful API endpoints (see `src/routes/`)
- Authentication (local, Google OAuth)
- Session and CSRF protection
- Rate limiting and error handling
- Media upload and management (Cloudinary integration)
- Database migrations and seeding (Drizzle ORM)
- Environment validation (Zod)
- TypeScript, ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- PostgreSQL database
- Cloudinary account (for media uploads)

### Installation

```sh
pnpm install
```

### Environment Setup

Create a `.env` file with the following variables:

```
DATABASE_URL=your_postgres_url
PORT=3000
SECRET=your_session_secret
NODE_ENV=development
SESSION_COOKIE_NAME=session
ORIGIN_URL=http://localhost:3000
COOKIE_SETTINGS=locally
COOKIE_DOMAIN=localhost
COOKIE_SAME_SITE=lax
OTP_RESET_EXPIRY=600
SHOW_OTP=true
API_URL=http://localhost:3000/api
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Database Setup

- Run migrations:
  ```sh
  pnpm run db:migrate
  ```
- Seed database:
  ```sh
  pnpm run db:seed
  ```

### Development

```sh
pnpm run dev
```

### Build

```sh
pnpm run build
```

### Start

```sh
pnpm start
```

## API Endpoints

- All routes are prefixed with `/api`
- See `src/routes/app.routes.ts` and feature folders for details

## Scripts

- `dev`: Start development server with hot reload
- `build`: Type-check, lint, and build
- `start`: Run production build
- `db:migrate`, `db:seed`, etc.: Database management
- `format`, `lint`: Code quality tools

## Folder Structure

- `src/app/`: Feature modules (authentication, media)
- `src/core/`: Core utilities and config
- `src/databases/drizzle/`: Database setup and schema
- `src/routes/`: API route definitions
- `src/seed/`: Database seeders
- `src/service/`: Service layer
- `src/settings/`: App settings and middleware
- `src/utils/`: Utility functions
- `src/validators/`: Validation schemas

## License

UNLICENSED

---

For more details, see the source code and comments in each module.
