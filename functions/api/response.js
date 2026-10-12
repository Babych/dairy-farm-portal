// Standardized HTTP Response & Error Helpers for Cloudflare Pages Functions

export function jsonResponse(data, status = 200, headers = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            ...headers
        }
    });
}

export function jsonOk(data, status = 200) {
    return jsonResponse(data, status);
}

export function jsonError(message, status = 400, details = null) {
    const payload = {
        success: false,
        detail: message,
        error: message
    };
    if (details) payload.details = details;
    return jsonResponse(payload, status);
}

export function jsonNotFound(resource = "Resource") {
    return jsonError(`${resource} not found`, 404);
}

export function jsonUnauthorized(message = "Unauthorized access") {
    return jsonError(message, 401);
}

export function jsonForbidden(message = "Forbidden action") {
    return jsonError(message, 403);
}
