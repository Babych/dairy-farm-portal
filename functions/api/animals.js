// Feature Module: Animals Herd Management & Animal Details
// Flat 1-level collocation for AI vibe-coding

export async function handleAnimals({ path, method, request, url, db, jsonResponse, getActiveFarmId }) {
    // 1. GET /api/animals
    if (path === "/api/animals" && method === "GET") {
        const limit = parseInt(url.searchParams.get("limit") || "50");
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const search = url.searchParams.get("search") || "";
        const status = url.searchParams.get("status") || "ALL";
        const farmId = getActiveFarmId();

        let query = "SELECT * FROM animals WHERE 1=1";
        const params = [];

        if (farmId) {
            query += " AND farm_id = ?";
            params.push(farmId);
        }
        if (search) {
            query += " AND (farm_number LIKE ? OR official_tag LIKE ? OR name LIKE ?)";
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (status === "Quarantine") {
            query += " AND id IN (SELECT animal_id FROM health_events WHERE is_active_withholding = 1 OR milk_withholding_until >= date('now'))";
        } else if (status !== "ALL") {
            query += " AND current_status = ?";
            params.push(status);
        }

        const countQuery = query.replace("SELECT *", "SELECT count(*) as c");
        const total = (await db.prepare(countQuery).bind(...params).first())?.c || 0;

        query += " ORDER BY farm_number ASC LIMIT ? OFFSET ?";
        params.push(limit, offset);

        const items = (await db.prepare(query).bind(...params).all()).results;
        return jsonResponse({ total, items, offset, limit });
    }

    // 2. POST /api/animals (Insert single animal or batch list)
    if (path === "/api/animals" && method === "POST") {
        const body = await request.json();
        const items = Array.isArray(body) ? body : [body];
        let inserted = 0;

        for (const item of items) {
            const id = item.id || crypto.randomUUID();
            const farmId = item.farm_id || (await db.prepare("SELECT id FROM farms LIMIT 1").first())?.id;
            await db.prepare(`
                INSERT INTO animals (
                    id, farm_id, farm_number, official_tag, name, birth_date,
                    lactation_number, current_status, last_calving_date, expected_calving_date,
                    transponder_code, dam_tag, sire_tag, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `).bind(
                id, farmId, item.farm_number || "0", item.official_tag || null, item.name || null, item.birth_date || null,
                item.lactation_number || 0, item.current_status || "Active", item.last_calving_date || null, item.expected_calving_date || null,
                item.transponder_code || null, item.dam_tag || null, item.sire_tag || null
            ).run();
            inserted++;
        }

        return jsonResponse({ status: "success", inserted_count: inserted }, 201);
    }

    // 3. DELETE /api/animals/:id
    if (path.startsWith("/api/animals/") && method === "DELETE") {
        const animalId = path.split("/")[3];
        await db.prepare("DELETE FROM reproduction_events WHERE animal_id = ?").bind(animalId).run();
        await db.prepare("DELETE FROM health_events WHERE animal_id = ?").bind(animalId).run();
        await db.prepare("DELETE FROM animals WHERE id = ?").bind(animalId).run();
        return jsonResponse({ status: "success", deleted_id: animalId });
    }

    // 4. GET /api/animals/:id (Animal Passport + Repro & Health History)
    if (path.startsWith("/api/animals/") && method === "GET") {
        const parts = path.split("/");
        const animalId = parts[3];
        const animal = await db.prepare("SELECT * FROM animals WHERE id = ?").bind(animalId).first();
        if (!animal) return jsonResponse({ detail: "Корову не знайдено" }, 404);

        const repro = (await db.prepare("SELECT * FROM reproduction_events WHERE animal_id = ? ORDER BY event_date DESC").bind(animalId).all()).results;
        const health = (await db.prepare("SELECT * FROM health_events WHERE animal_id = ? ORDER BY event_date DESC").bind(animalId).all()).results;

        return jsonResponse({
            ...animal,
            reproduction_history: repro,
            health_history: health
        });
    }

    return null;
}
