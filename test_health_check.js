/**
 * Integration & Health Check Suite for DairyERP Portal & Cloudflare Functions
 * Run with: node test_health_check.js [optional_target_url]
 * Default target: https://dairy-farm-portal.pages.dev
 */

const targetUrl = process.argv[2] || "https://dairy-farm-portal.pages.dev";

const endpoints = [
    {
        name: "Root HTML Document",
        path: "/",
        expectedStatus: 200,
        expectedContentType: "text/html",
        validate: (text) => text.includes("DairyERP") && text.includes("loginScreen")
    },
    {
        name: "System Status API",
        path: "/api/system/status",
        expectedStatus: 200,
        expectedContentType: "application/json",
        validate: (data) => data.is_configured === true && typeof data.cows_count === 'number'
    },
    {
        name: "Farms API (Cloudflare Pages Function & D1)",
        path: "/api/farms",
        expectedStatus: 200,
        expectedContentType: "application/json",
        validate: (data) => Array.isArray(data) && data.length > 0 && !!data[0].id
    },
    {
        name: "Animals API (D1 Database Query)",
        path: "/api/animals?farm_id=310c1bca-5bf3-4257-a66f-e91a01c23635&limit=5",
        expectedStatus: 200,
        expectedContentType: "application/json",
        validate: (data) => Array.isArray(data.items) && data.items.length > 0 && !!data.items[0].farm_number
    },
    {
        name: "Dashboard Stats API",
        path: "/api/dashboard/stats?farm_id=310c1bca-5bf3-4257-a66f-e91a01c23635",
        expectedStatus: 200,
        expectedContentType: "application/json",
        validate: (data) => typeof data === 'object' && ('total_cows' in data || 'active_lactating' in data)
    },
    {
        name: "Event Grid API",
        path: "/api/dashboard/event-grid?farm_id=310c1bca-5bf3-4257-a66f-e91a01c23635",
        expectedStatus: 200,
        expectedContentType: "application/json",
        validate: (data) => Array.isArray(data.events) && typeof data.total_events === 'number'
    }
];

async function runTests() {
    console.log(`\n🐮 [Integration Test] Перевірка працездатності: ${targetUrl}`);
    console.log(`======================================================================`);
    
    let passed = 0;
    let failed = 0;

    for (const ep of endpoints) {
        const url = `${targetUrl}${ep.path}`;
        process.stdout.write(`⏳ Перевірка: ${ep.name} (${ep.path})... `);
        
        try {
            const res = await fetch(url);
            const contentType = res.headers.get("content-type") || "";
            
            if (res.status !== ep.expectedStatus) {
                console.log(`❌ FAILED (Очікувався HTTP ${ep.expectedStatus}, отримано ${res.status})`);
                failed++;
                continue;
            }

            if (!contentType.includes(ep.expectedContentType)) {
                console.log(`❌ FAILED (Очікувався ${ep.expectedContentType}, отримано ${contentType})`);
                if (ep.expectedContentType === "application/json" && contentType.includes("text/html")) {
                    console.log(`   ⚠️ КРИТИЧНО: Бекенд-функція не підхопилася Cloudflare Pages! Запит повернув статичний HTML замість JSON.`);
                }
                failed++;
                continue;
            }

            let valid = false;
            if (ep.expectedContentType === "application/json") {
                const json = await res.json();
                valid = ep.validate(json);
            } else {
                const text = await res.text();
                valid = ep.validate(text);
            }

            if (!valid) {
                console.log(`❌ FAILED (Тіло відповіді не пройшло валідацію структури)`);
                failed++;
            } else {
                console.log(`✅ OK (${res.status}, ${contentType.split(';')[0]})`);
                passed++;
            }
        } catch (err) {
            console.log(`❌ ERROR (${err.message})`);
            failed++;
        }
    }

    console.log(`======================================================================`);
    console.log(`Підсумок: Пройдено: ${passed} / ${endpoints.length} | Помилок: ${failed}\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
