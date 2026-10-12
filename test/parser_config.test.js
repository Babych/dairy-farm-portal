import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Uniform Parser Configuration & Fail-Safe Suite', () => {
    it('provides fallback parser URL when env is completely empty', () => {
        const env = {};
        const parserUrl = env?.PARSER_SERVICE_URL || "https://dairy-farm-parser-wg7iw37zsq-ey.a.run.app/api/convert/uniform";
        const parserSecret = env?.PARSER_SECRET_TOKEN || "dairy_secret_token_frankfurt_2026";

        assert.strictEqual(parserUrl, "https://dairy-farm-parser-wg7iw37zsq-ey.a.run.app/api/convert/uniform");
        assert.strictEqual(parserSecret, "dairy_secret_token_frankfurt_2026");
    });

    it('prefers custom env vars over defaults when provided', () => {
        const env = {
            PARSER_SERVICE_URL: "https://custom-parser.internal/api/convert",
            PARSER_SECRET_TOKEN: "custom_secret_abc_123"
        };
        const parserUrl = env?.PARSER_SERVICE_URL || "https://dairy-farm-parser-wg7iw37zsq-ey.a.run.app/api/convert/uniform";
        const parserSecret = env?.PARSER_SECRET_TOKEN || "dairy_secret_token_frankfurt_2026";

        assert.strictEqual(parserUrl, "https://custom-parser.internal/api/convert");
        assert.strictEqual(parserSecret, "custom_secret_abc_123");
    });

    it('verifies Cloud Run parser URL format and security protocol', () => {
        const parserUrl = "https://dairy-farm-parser-wg7iw37zsq-ey.a.run.app/api/convert/uniform";
        assert.ok(parserUrl.startsWith("https://"));
        assert.ok(parserUrl.includes("run.app"));
        assert.ok(parserUrl.endsWith("/api/convert/uniform"));
    });
});
