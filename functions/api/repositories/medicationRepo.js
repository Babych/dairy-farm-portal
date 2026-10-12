// Repository: Medications & Pharmacy Persistence (Cloudflare D1)

export class MedicationRepository {
    /**
     * List all medications with normalized withdrawal days and expiry status.
     * @param {import('../../../types/cloudflare.d.ts').D1Database} db
     */
    static async getAll(db) {
        /** @type {Array<Record<string, any>>} */
        const rawMeds = (await db.prepare("SELECT * FROM medications ORDER BY name ASC").all()).results || [];
        const now = new Date();

        return rawMeds.map(m => {
            let daysToExpire = null;
            let statusExpiry = "OK";
            if (m.expiration_date) {
                const exp = new Date(m.expiration_date);
                if (!isNaN(exp.getTime())) {
                    daysToExpire = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (daysToExpire < 0) statusExpiry = "EXPIRED";
                    else if (daysToExpire <= 30) statusExpiry = "EXPIRING_SOON";
                }
            }
            return {
                ...m,
                milk_days: Number(m.default_milk_withdrawal_days ?? 0),
                meat_days: Number(m.default_meat_withdrawal_days ?? 0),
                days_to_expire: daysToExpire,
                status_expiry: statusExpiry
            };
        });
    }

    /**
     * Create new medication record.
     * @param {import('../../../types/cloudflare.d.ts').D1Database} db
     * @param {Object} data
     */
    static async create(db, data) {
        const medId = crypto.randomUUID();
        const name = (data.name || "").trim();
        const activeSubstance = data.active_substance || null;
        const batchNumber = data.batch_number || null;
        const expirationDate = data.expiration_date || null;
        const stockQuantity = parseFloat(data.stock_quantity) || 0;
        const unit = data.unit || "дози";
        const milkDays = parseInt(data.default_milk_withdrawal_days) || 0;
        const meatDays = parseInt(data.default_meat_withdrawal_days) || 0;
        const instructions = data.instructions || null;

        await db.prepare(`
            INSERT INTO medications (
                id, name, active_substance, batch_number, expiration_date,
                stock_quantity, unit, default_milk_withdrawal_days, default_meat_withdrawal_days,
                instructions, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
            medId, name, activeSubstance, batchNumber, expirationDate,
            stockQuantity, unit, milkDays, meatDays, instructions
        ).run();

        return { id: medId, name };
    }

    /**
     * Delete medication by ID.
     * @param {import('../../../types/cloudflare.d.ts').D1Database} db
     * @param {string} medId
     */
    static async deleteById(db, medId) {
        return await db.prepare("DELETE FROM medications WHERE id = ?").bind(medId).run();
    }
}
