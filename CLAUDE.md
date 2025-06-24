# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PasswordSafe is a secure password management application built with Next.js 15, implementing zero-knowledge architecture where all sensitive data is encrypted client-side. The application uses RSA-4096 + AES-GCM encryption with PBKDF2 key derivation (100,000 iterations) and integrates with Clerk for authentication.

## Development Commands

### Core Development

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server

### Database

- `npm run migrate` - Run Prisma database migrations
- `npm run generate` - Generate Prisma client (outputs to `generated/prisma/`)

### Code Quality

- `npm run lint` - Run ESLint with zero warnings policy
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run type-check` - Run TypeScript compiler without emitting files
- `npm run format` - Check code formatting with Prettier
- `npm run format:fix` - Auto-fix formatting issues
- `npm run check` - Run all checks (type-check + lint + format)
- `npm run fix` - Auto-fix all issues (lint + format)

### Deployment

- `npm run vercel-build` - Deploy migrations and build for Vercel

## Architecture Overview

### Security Architecture

- **Zero-knowledge encryption**: All secrets encrypted client-side with RSA-4096 keys
- **Key management**: Private keys wrapped with AES-GCM using PBKDF2-derived KEK (100,000 iterations)
- **Vault system**: Each vault has its own wrapped key for compartmentalization
- **Client-side crypto**: Uses Web Crypto API exclusively (no JavaScript crypto libraries)

### Data Flow

1. User authenticates with Clerk
2. Master password derives KEK to unwrap private key (client-side only)
3. Private key decrypts vault keys
4. Vault keys encrypt/decrypt individual secrets
5. Only encrypted data is stored in database

### Key Components

#### Authentication & Authorization (`lib/auth.ts`)

- `requireUser()` - Validates Clerk authentication
- `requireVaultAccess()` - Ensures user owns vault
- `requireSecretAccess()` - Ensures user owns secret through vault ownership
- `withAuth()`, `withVaultAccess()`, `withSecretAccess()` - Higher-order functions for server actions

#### Cryptography (`lib/crypto.ts`)

- `CryptoService` class handles all cryptographic operations
- Key generation, wrapping/unwrapping, encryption/decryption
- Uses RSA-OAEP for key operations, AES-GCM for data encryption
- PBKDF2 with SHA-256 for key derivation

#### Key Management (`context/KeyStore.tsx`)

- Client-side context for managing decrypted keys in memory
- Automatically prompts for master password when keys needed
- Clears keys on logout for security

#### Server Actions (`app/actions/`)

- `_userActions.ts` - User data and onboarding
- `_vaultActions.ts` - Vault CRUD operations
- `_secretActions.ts` - Secret CRUD operations
- All actions use auth wrappers and error handling

### Database Schema (PostgreSQL + Prisma)

```
User
├── id (Clerk user ID)
├── email
├── salt (for PBKDF2)
├── publicKey (base64)
├── wrappedPrivateKey (base64)
└── vaults[]

Vault
├── id (UUID)
├── userId
├── name
├── wrappedKey (encrypted with user's public key)
└── secrets[]

Secret
├── id (UUID)
├── vaultId
├── title
└── encryptedData (encrypted with vault key)
```

## Development Guidelines

### Security Requirements

- Never transmit master passwords or unencrypted secrets to server
- Always validate UUIDs before database queries
- Use provided auth wrappers for all server actions
- Clear sensitive data from memory when possible

### Code Style

- Strict TypeScript with consistent-type-imports enforced
- Import ordering: builtin → external → internal → parent → sibling → index
- Security ESLint rules enabled (no object injection, unsafe regex detection)
- Prettier with Tailwind plugin for consistent formatting

### UI Components

- Use shadcn/ui components from https://ui.shadcn.com/docs for new UI elements
- Never create custom UI components when shadcn/ui alternatives exist
- Install new shadcn/ui components using the CLI rather than manually creating them

### Error Handling

- Use structured error types from `lib/errors.ts`
- Server actions wrapped with `withErrorHandling()` for consistent responses
- Client-side error boundaries for graceful degradation

### Testing & Validation

Always run quality checks before committing:

```bash
npm run check  # Runs type-check + lint + format
```

## File Structure Patterns

- `app/` - Next.js 15 App Router pages and layouts
- `app/actions/` - Server actions (prefixed with `_` for security)
- `components/` - Reusable UI components (uses shadcn/ui)
- `context/` - React contexts (KeyStore for crypto, QueryClient for data)
- `lib/` - Core utilities (auth, crypto, errors, prisma)
- `generated/` - Auto-generated files (Prisma client)
- `prisma/` - Database schema and migrations

## Environment Setup

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- Clerk authentication keys (see example.env if available)
