// Pure Web Crypto Security Utility: HMAC-SHA256 JWT & PBKDF2 Password Hashing
// Zero external dependencies, 100% compatible with Cloudflare Workers / Pages V8 isolates

function base64UrlEncode(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Signs a payload with HMAC-SHA256 using JWT_SECRET_KEY
 */
export async function signJWT(payload, secretKey) {
    if (!secretKey) {
        throw new Error("Server security error: JWT_SECRET_KEY is not configured in environment secrets.");
    }

    const header = { alg: "HS256", typ: "JWT" };
    const enc = new TextEncoder();
    
    const headerStr = base64UrlEncode(enc.encode(JSON.stringify(header)));
    const payloadStr = base64UrlEncode(enc.encode(JSON.stringify(payload)));
    const dataToSign = enc.encode(`${headerStr}.${payloadStr}`);

    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(secretKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, dataToSign);
    const signatureStr = base64UrlEncode(new Uint8Array(signature));

    return `${headerStr}.${payloadStr}.${signatureStr}`;
}

/**
 * Verifies a JWT token signature and expiration
 */
export async function verifyJWT(token, secretKey) {
    if (!token || !secretKey) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerStr, payloadStr, signatureStr] = parts;
    const enc = new TextEncoder();

    try {
        const key = await crypto.subtle.importKey(
            "raw",
            enc.encode(secretKey),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["verify"]
        );

        const dataToSign = enc.encode(`${headerStr}.${payloadStr}`);
        const signatureBytes = base64UrlDecode(signatureStr);

        const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, dataToSign);
        if (!isValid) return null;

        const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadStr));
        const payload = JSON.parse(payloadJson);

        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return null; // Expired
        }

        return payload;
    } catch (e) {
        return null;
    }
}

/**
 * Hashes a password using PBKDF2 with SHA-256 and salt
 * Format: pbkdf2_sha256$iterations$salt$hash
 */
export async function hashPassword(password, saltHex = null, iterations = 100000) {
    if (!password) throw new Error("Password cannot be empty");
    const enc = new TextEncoder();

    let saltBytes;
    if (saltHex) {
        saltBytes = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    } else {
        saltBytes = new Uint8Array(16);
        crypto.getRandomValues(saltBytes);
    }

    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: saltBytes,
            iterations,
            hash: "SHA-256"
        },
        keyMaterial,
        256
    );

    const hashHex = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    const saltString = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    return `pbkdf2_sha256$${iterations}$${saltString}$${hashHex}`;
}

/**
 * Verifies a password against a stored PBKDF2 hash
 */
export async function verifyPassword(password, storedHash) {
    if (!password || !storedHash) return false;
    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') return false;

    const iterations = parseInt(parts[1], 10);
    const saltHex = parts[2];
    const expectedHashHex = parts[3];

    const computed = await hashPassword(password, saltHex, iterations);
    const computedHashHex = computed.split('$')[3];

    return computedHashHex === expectedHashHex;
}
