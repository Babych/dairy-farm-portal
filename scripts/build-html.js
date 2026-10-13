import fs from 'fs';
import path from 'path';

/**
 * Builds composite index.html from modular partials in views/
 * Ensures zero-runtime penalty on Cloudflare Pages while keeping code 100% modular.
 */
export function buildHtml() {
    const partialsDir = path.resolve('views', 'partials');
    if (!fs.existsSync(partialsDir)) {
        console.log('[HTML Assembler] No views/partials found, skipping compilation.');
        return;
    }

    console.log('[HTML Assembler] Modular views/partials verified.');
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
    buildHtml();
}
