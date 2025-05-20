"use client";

import { useKeyStore } from "../context/KeyStore";

export default function Page() {
  const { isInitialized, privateKey, publicKey } = useKeyStore();

  if (!isInitialized) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <p>Private Key: {JSON.stringify(privateKey.algorithm)}</p>
      <p>Public Key: {JSON.stringify(publicKey.algorithm)}</p>
    </div>
  );
}
