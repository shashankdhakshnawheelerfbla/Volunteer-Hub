import { argon2id, argon2Verify, setWASMModules } from "argon2-wasm-edge";

import argon2WASM from "argon2-wasm-edge/wasm/argon2.wasm";
import blake2bWASM from "argon2-wasm-edge/wasm/blake2b.wasm";

let initialization;

async function initializeArgon2() {
    if (!initialization) {
        initialization = setWASMModules({
            argon2WASM,
            blake2bWASM
        });
    }

    await initialization;
}

export async function hashPassword(password) {
    await initializeArgon2();

    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);

    return await argon2id({
        password,
        salt,
        parallelism: 1,
        iterations: 3,
        memorySize: 19456,
        hashLength: 32,
        outputType: "encoded"
    });
}

export async function verifyPassword(password, storedHash) {
    await initializeArgon2();

    return await argon2Verify({
        password,
        hash: storedHash
    });
}
