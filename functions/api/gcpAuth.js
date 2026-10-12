// Google Cloud IAM Service Account Identity Token Helper for Cloudflare Pages (Edge WebCrypto)
// Enables zero-trust calls to private Google Cloud Run services (--no-allow-unauthenticated)

function base64UrlEncode(str) {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem) {
    const b64Lines = pem.replace(/-----[^\n]+-----/g, "").replace(/\s+/g, "");
    const str = atob(b64Lines);
    const buf = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        buf[i] = str.charCodeAt(i);
    }
    return buf.buffer;
}

/**
 * Generates an OIDC Google Identity Token for a specific Cloud Run audience URL.
 * Requires GCP_SERVICE_ACCOUNT_KEY secret (JSON string of GCP service account key).
 * @param {string} targetAudience - Cloud Run service base URL (e.g., https://...run.app)
 * @param {string} saKeyJson - JSON credentials of GCP Service Account
 * @returns {Promise<string|null>} Google ID Token or null if key is not configured
 */
export async function getGoogleIdToken(targetAudience, saKeyJson) {
    if (!saKeyJson || !targetAudience) return null;

    try {
        const key = typeof saKeyJson === 'string' ? JSON.parse(saKeyJson) : saKeyJson;
        const now = Math.floor(Date.now() / 1000);

        const header = {
            alg: "RS256",
            typ: "JWT"
        };

        const claimSet = {
            iss: key.client_email,
            sub: key.client_email,
            aud: "https://oauth2.googleapis.com/token",
            target_audience: targetAudience,
            iat: now,
            exp: now + 3600
        };

        const encodedHeader = base64UrlEncode(JSON.stringify(header));
        const encodedClaims = base64UrlEncode(JSON.stringify(claimSet));
        const unsignedJwt = `${encodedHeader}.${encodedClaims}`;

        // Import RSA private key using Edge WebCrypto
        const binaryKey = pemToArrayBuffer(key.private_key);
        const cryptoKey = await crypto.subtle.importKey(
            "pkcs8",
            binaryKey,
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            false,
            ["sign"]
        );

        const signatureBuffer = await crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            cryptoKey,
            new TextEncoder().encode(unsignedJwt)
        );

        const signatureStr = String.fromCharCode(...new Uint8Array(signatureBuffer));
        const encodedSignature = base64UrlEncode(signatureStr);
        const assertion = `${unsignedJwt}.${encodedSignature}`;

        // Exchange signed JWT assertion for Google Identity Token
        const resp = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: assertion
            })
        });

        if (!resp.ok) {
            console.warn("Failed to exchange JWT for Google ID Token:", await resp.text());
            return null;
        }

        const data = await resp.json();
        return data.id_token || null;
    } catch (err) {
        console.error("Error creating Google ID Token:", err);
        return null;
    }
}
