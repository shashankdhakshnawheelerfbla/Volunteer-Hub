const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export function generateSessionToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);

    return Array.from(
        bytes,
        byte => byte.toString(16).padStart(2, "0")
    ).join("");
}

export async function hashSessionToken(token) {
    const encodedToken = new TextEncoder().encode(token);

    const digest = await crypto.subtle.digest(
        "SHA-256",
        encodedToken
    );

    return Array.from(
        new Uint8Array(digest),
        byte => byte.toString(16).padStart(2, "0")
    ).join("");
}

export function getSessionExpiration() {
    return new Date(
        Date.now() + SESSION_DURATION_SECONDS * 1000
    ).toISOString();
}

export function getSessionCookie(token) {
    return [
        `__Host-volunteer_session=${token}`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        `Max-Age=${SESSION_DURATION_SECONDS}`
    ].join("; ");
}

export function getClearSessionCookie() {
    return [
        "__Host-volunteer_session=",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Path=/",
        "Max-Age=0"
    ].join("; ");
}
