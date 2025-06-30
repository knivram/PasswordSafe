# PasswordSafe

PasswordSafe is a school project that demonstrates a zero-knowledge password manager built with **Next.js 15**. All secrets are encrypted in the browser using modern cryptography so the server never sees a user's master password or plaintext data.

## Technologies

- **Next.js** with TypeScript for the web application
- **Tailwind CSS** and shadcn/ui for styling
- **Clerk** for authentication and user management
- **Prisma** with **PostgreSQL** for data storage
- **React Query** for client side data fetching
- **Web Crypto API** for RSA‑4096 and AES‑GCM encryption

## How It Works

1. When a user signs up, the browser generates a 4096‑bit RSA key pair.
2. The private key is encrypted with a key derived from the user's master password via PBKDF2 (100,000 iterations, SHA‑256). Only the encrypted key and the salt are stored on the server.
3. Each vault has its own AES‑GCM key that is encrypted with the user's public key. The server only stores these wrapped vault keys and encrypted secrets.
4. When the user provides the master password, the private key is unwrapped in memory and used to decrypt vault keys and secrets.
5. Vaults can be shared by re‑encrypting the vault key with another user's public key. Roles (OWNER, EDITOR, VIEWER) control access.

For a more in‑depth look at the security design see [SECURITY_CONCEPT.md](SECURITY_CONCEPT.md).

## Develop

1. Copy `.env.example` to `.env` and provide a `DATABASE_URL` plus your Clerk keys.
2. Start the database with `docker compose up -d` (or use your own PostgreSQL instance).
3. Install dependencies with `npm install` and run migrations: `npm run migrate`.
4. Launch the dev server with `npm run dev`.

### Useful scripts

- `npm run generate` – regenerate the Prisma client without migrating
- `npm run check` – run TypeScript, ESLint and Prettier
- `npm run fix` – auto‑fix lint and formatting issues
