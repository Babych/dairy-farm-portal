// Feature Module: Farms Management & Switching
// Flat 1-level collocation for AI vibe-coding
import { signJWT } from './crypto.js';

export async function handleFarms({ path, method, request, url, env, db, jsonResponse }) {
    // 1. GET /api/farms
    if (path === "/api/farms" && method === "GET") {
        const auth = request.headers.get("authorization") || "";
        let userEmail = null;
        let userRole = null;
        let activeFarmId = url.searchParams.get("active_farm_id") || null;
        if (auth.startsWith("Bearer ")) {
            try {
                const tokenPart = auth.split(" ")[1];
                const decoded = JSON.parse(atob(tokenPart.split(".")[1]));
                userEmail = decoded.sub || null;
                userRole = decoded.role || null;
                if (!activeFarmId) activeFarmId = decoded.farm_id || null;
            } catch (e) {}
        }

        let query = `
            SELECT f.id, f.code, f.name, f.farmer_name, f.address, f.city, f.phone, f.owner_email,
                   count(a.id) as cow_count, 0 as is_current, f.created_at
            FROM farms f
            LEFT JOIN animals a ON a.farm_id = f.id
        `;
        const params = [];
        if (userRole === "superadmin") {
            // superadmin sees all farms
        } else if (userEmail) {
            query += " WHERE f.owner_email = ?";
            params.push(userEmail);
        } else {
            query += " WHERE f.owner_email IS NULL";
        }
        query += " GROUP BY f.id ORDER BY f.created_at ASC";

        const rawFarms = (await db.prepare(query).bind(...params).all()).results;
        const farms = rawFarms.map((f, idx) => ({
            ...f,
            is_current: activeFarmId ? (f.id === activeFarmId ? 1 : 0) : (idx === 0 ? 1 : 0)
        }));
        return jsonResponse(farms);
    }

    // 2. POST /api/farms/switch/:id (Switch active farm context)
    if (path.startsWith("/api/farms/switch/") && method === "POST") {
        const farmId = path.split("/")[4];
        const farm = await db.prepare("SELECT * FROM farms WHERE id = ?").bind(farmId).first();
        if (!farm) {
            return jsonResponse({ detail: "Ферму не знайдено" }, 404);
        }

        const auth = request.headers.get("authorization") || "";
        let userEmail = "demo.farmer@dairy-erp.farm";
        let userRole = "superadmin";
        if (auth.startsWith("Bearer ")) {
            try {
                const tokenPart = auth.split(" ")[1];
                const decoded = JSON.parse(atob(tokenPart.split(".")[1]));
                userEmail = decoded.sub || userEmail;
                userRole = decoded.role || userRole;
            } catch (e) {}
        }

        // Issue updated token scoped to selected farm
        const jwtSecret = env?.JWT_SECRET_KEY || "ephemeral_local_dev_token_key_change_in_prod";
        const payload = {
            sub: userEmail,
            role: userRole,
            farm_id: farm.id,
            exp: Math.floor(Date.now() / 1000) + 86400 * 7
        };
        const token = await signJWT(payload, jwtSecret);

        return jsonResponse({
            status: "success",
            message: `Перемкнуто на ферму '${farm.name}'`,
            access_token: token,
            farm: farm
        });
    }

    // 3. POST /api/farms (Create New Farm)
    if (path === "/api/farms" && method === "POST") {
        const body = await request.json();
        const farmId = body.id || crypto.randomUUID();
        const farmCode = body.code || `FARM_${Date.now().toString(36).toUpperCase()}`;
        const farmName = body.name || "Нова приватна ферма";
        const ownerEmail = body.owner_email || null;

        await db.prepare(`
            INSERT INTO farms (id, code, name, farmer_name, owner_email, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(farmId, farmCode, farmName, body.farmer_name || null, ownerEmail).run();

        return jsonResponse({
            status: "success",
            message: `Ферму '${farmName}' успішно створено`,
            farm_id: farmId,
            farm: { id: farmId, code: farmCode, name: farmName, owner_email: ownerEmail }
        }, 201);
    }

    // 4. PUT /api/farms/:id (Update Farm Passport Info)
    if (path.startsWith("/api/farms/") && method === "PUT") {
        const farmId = path.split("/")[3];
        const body = await request.json();
        const farmName = (body.name || "").trim();
        const farmerName = (body.farmer_name || "").trim();
        const city = (body.city || "").trim();
        const address = (body.address || "").trim();
        const phone = (body.phone || "").trim();

        if (!farmName) {
            return jsonResponse({ detail: "Назва ферми не може бути порожньою" }, 400);
        }

        await db.prepare(`
            UPDATE farms 
            SET name = ?, farmer_name = ?, city = ?, address = ?, phone = ?
            WHERE id = ?
        `).bind(farmName, farmerName || null, city || null, address || null, phone || null, farmId).run();

        return jsonResponse({
            status: "success",
            message: `Паспорт ферми '${farmName}' успішно оновлено!`,
            farm: { id: farmId, name: farmName, farmer_name: farmerName, city, address, phone }
        });
    }

    // 5. DELETE /api/farms/:id
    if (path.startsWith("/api/farms/") && method === "DELETE") {
        const farmId = path.split("/")[3];

        const targetFarm = await db.prepare("SELECT * FROM farms WHERE id = ?").bind(farmId).first();
        if (!targetFarm) {
            return jsonResponse({ detail: "Ферму не знайдено" }, 404);
        }

        try {
            // Unlink users referencing this farm
            await db.prepare("UPDATE users SET farm_id = NULL WHERE farm_id = ?").bind(farmId).run();

            // Cascade delete events & animals
            await db.prepare("DELETE FROM reproduction_events WHERE animal_id IN (SELECT id FROM animals WHERE farm_id = ?)").bind(farmId).run();
            await db.prepare("DELETE FROM health_events WHERE animal_id IN (SELECT id FROM animals WHERE farm_id = ?)").bind(farmId).run();
            await db.prepare("DELETE FROM animals WHERE farm_id = ?").bind(farmId).run();
            await db.prepare("DELETE FROM audit_logs WHERE farm_id = ?").bind(farmId).run();

            // Delete farm record
            await db.prepare("DELETE FROM farms WHERE id = ?").bind(farmId).run();

            const remainingFarms = (await db.prepare("SELECT * FROM farms ORDER BY created_at DESC").all()).results;
            let nextFarm = remainingFarms[0] || null;

            if (!nextFarm) {
                const newFarmId = crypto.randomUUID();
                const newFarmCode = `FARM_${Date.now().toString(36).toUpperCase()}`;
                const newFarmName = "Нова ферма";
                await db.prepare(`
                    INSERT INTO farms (id, code, name, created_at)
                    VALUES (?, ?, ?, datetime('now'))
                `).bind(newFarmId, newFarmCode, newFarmName).run();
                nextFarm = { id: newFarmId, code: newFarmCode, name: newFarmName, cow_count: 0 };
            }

            await db.prepare("UPDATE users SET farm_id = ? WHERE farm_id IS NULL").bind(nextFarm.id).run();

            const jwtSecret = env?.JWT_SECRET_KEY || "ephemeral_local_dev_token_key_change_in_prod";
            const updatedPayload = {
                sub: "user",
                farm_id: nextFarm.id,
                exp: Math.floor(Date.now() / 1000) + (30 * 24 * 3600)
            };
            const newToken = await signJWT(updatedPayload, jwtSecret);

            try {
                const auditId = crypto.randomUUID();
                await db.prepare(`
                    INSERT INTO audit_logs (id, farm_id, entity_type, entity_id, action, summary, user_email, created_at)
                    VALUES (?, ?, 'FARM', ?, 'DELETE', ?, 'admin', datetime('now'))
                `).bind(auditId, nextFarm.id, farmId, `Видалено базу ферми: ${targetFarm.name}`).run();
            } catch (e) {}

            return jsonResponse({
                status: "success",
                message: `Базу ферми '${targetFarm.name}' успішно видалено`,
                next_farm_id: nextFarm.id,
                access_token: newToken
            });
        } catch (err) {
            try {
                const errLogId = crypto.randomUUID();
                await db.prepare(`
                    INSERT INTO system_logs (id, farm_id, level, category, message, details, created_at)
                    VALUES (?, ?, 'ERROR', 'DATABASE', ?, ?, datetime('now'))
                `).bind(errLogId, farmId, `Помилка видалення бази ферми: ${err.message}`, err.stack || err.toString()).run();
            } catch (logErr) {}
            return jsonResponse({ detail: `Помилка видалення бази з БД: ${err.message}` }, 500);
        }
    }

    return null; // Not handled by this feature module
}
