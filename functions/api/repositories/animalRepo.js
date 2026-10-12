// Repository: Animals Persistence & Data Queries (Cloudflare D1)

export class AnimalRepository {
    /**
     * Search and paginate animals.
     */
    static async searchAnimals(db, { farmId = null, search = "", status = "ALL", limit = 50, offset = 0 } = {}) {
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

        const items = (await db.prepare(query).bind(...params).all()).results || [];
        return { total, items, offset, limit };
    }

    /**
     * Get single animal by ID with passport details.
     */
    static async getById(db, animalId) {
        return await db.prepare("SELECT * FROM animals WHERE id = ?").bind(animalId).first();
    }

    /**
     * Get animal 360 degree details including reproduction and health event history.
     */
    static async getAnimal360(db, animalId) {
        const animal = await this.getById(db, animalId);
        if (!animal) return null;

        const repro = (await db.prepare("SELECT * FROM reproduction_events WHERE animal_id = ? ORDER BY event_date DESC").bind(animalId).all()).results || [];
        const health = (await db.prepare("SELECT * FROM health_events WHERE animal_id = ? ORDER BY event_date DESC").bind(animalId).all()).results || [];

        return {
            ...animal,
            reproduction_history: repro,
            health_history: health
        };
    }

    /**
     * Batch insert or insert single animal.
     */
    static async batchInsert(db, items, defaultFarmId = null) {
        let inserted = 0;
        const fallbackFarmId = defaultFarmId || (await db.prepare("SELECT id FROM farms LIMIT 1").first())?.id;

        for (const item of items) {
            const id = item.id || crypto.randomUUID();
            const farmId = item.farm_id || fallbackFarmId;
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
        return inserted;
    }

    /**
     * Delete animal and all cascade events.
     */
    static async deleteCascade(db, animalId) {
        await db.prepare("DELETE FROM reproduction_events WHERE animal_id = ?").bind(animalId).run();
        await db.prepare("DELETE FROM health_events WHERE animal_id = ?").bind(animalId).run();
        await db.prepare("DELETE FROM animals WHERE id = ?").bind(animalId).run();
    }
}
