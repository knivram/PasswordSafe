This is a [Next.js](https://nextjs.org) project bootstrapped with
[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the
result.

You can start editing the page by modifying `app/page.tsx`. The page
auto-updates as you edit the file.

This project uses
[`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
to automatically optimize and load [Geist](https://vercel.com/font), a new font
family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js
  features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out
[the Next.js GitHub repository](https://github.com/vercel/next.js) - your
feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)
from the creators of Next.js.

Check out our
[Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying)
for more details.

```mermaid
flowchart TD
  %% Registration
  subgraph Registration
    direction TB
    C1[Client: Generate RSA-OAEP Key Pair] 
    C2[Client: Derive KEK from Password\nPBKDF2] 
    C3[Client: Wrap Private Key\nwith KEK AES-GCM] 
    C4[Client → Server:\nsend publicKey, salt, wrappedPrivKey] 
    S1[Server: Store publicKey, salt,\nwrappedPrivKey] 
  end

  %% Vault Creation
  subgraph Vault_Creation
    direction TB
    C5[Client: Generate AES-256 Vault Key] 
    C6[Client: Wrap Vault Key\nwith publicKey RSA-OAEP] 
    C7[Client → Server:\nsend wrappedVaultKey] 
    S2[Server: Store wrappedVaultKey] 
  end

  %% Login
  subgraph Login
    direction TB
    C8[Client → Server:\nsend email & password] 
    S3[Server: Verify Argon2 hash,\nreturn salt, wrappedPrivKey, wrappedVaultKey] 
    C9[Client: Derive KEK from Password\nPBKDF2] 
    C10[Client: Unwrap Private Key\nwith KEK AES-GCM] 
    C11[Client: Unwrap Vault Key\nwith Private Key RSA-OAEP] 
  end

  %% Vault Operations
  subgraph Vault_Operations
    direction TB
    C12[Client: Encrypt Secret\nwith Vault Key AES-GCM] 
    C13[Client → Server:\nsend ciphertext blob] 
    S4[Server: Store ciphertext] 
    C14[Client → Server:\nfetch ciphertext blob] 
    S5[Server: Return ciphertext] 
    C15[Client: Decrypt ciphertext\nwith Vault Key AES-GCM] 
  end

  %% Flow
  Registration --> Vault_Creation
  Vault_Creation --> Login
  Login --> Vault_Operations
```
