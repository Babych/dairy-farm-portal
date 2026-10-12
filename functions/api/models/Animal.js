// Domain Model: Animal (Cattle Herd Entity)
// Standardizes raw D1 rows, enforces types and zootech calculations

export class Animal {
    constructor(row = {}) {
        this.id = row.id || null;
        this.farmId = row.farm_id || null;
        this.legacyDierId = row.legacy_dier_id || null;
        this.farmNumber = String(row.farm_number || row.number || '').trim();
        this.officialTag = row.official_tag || null;
        this.name = row.name || null;
        this.birthDate = row.birth_date || null;
        this.gender = Number(row.gender) || 2; // 1 = Bull, 2 = Cow
        this.lactationNumber = Number.isInteger(Number(row.lactation_number)) ? Number(row.lactation_number) : 0;
        this.currentStatus = row.current_status || 'Active';
        this.lastCalvingDate = row.last_calving_date || null;
        this.expectedCalvingDate = row.expected_calving_date || null;
        this.lastInseminationDate = row.last_insemination_date || null;
        this.daysPregnant = Number(row.days_pregnant) || 0;
        this.transponderCode = row.transponder_code || null;
        this.damTag = row.dam_tag || null;
        this.sireTag = row.sire_tag || null;
        this.groupName = row.group_name || 'Група 1';
        this.createdAt = row.created_at || null;
        this.updatedAt = row.updated_at || null;
    }

    /**
     * Zootechnical Days In Milk (DIM) calculation
     */
    get dim() {
        if (!this.lastCalvingDate) return null;
        const calving = new Date(this.lastCalvingDate);
        if (isNaN(calving.getTime())) return null;
        const now = new Date();
        const diffMs = now.getTime() - calving.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return days >= 0 ? days : null;
    }

    /**
     * Serializes to standardized API JSON response
     */
    toJSON() {
        return {
            id: this.id,
            farm_id: this.farmId,
            legacy_dier_id: this.legacyDierId,
            farm_number: this.farmNumber,
            official_tag: this.officialTag,
            name: this.name,
            birth_date: this.birthDate,
            gender: this.gender,
            lactation_number: this.lactationNumber,
            current_status: this.currentStatus,
            last_calving_date: this.lastCalvingDate,
            expected_calving_date: this.expectedCalvingDate,
            last_insemination_date: this.lastInseminationDate,
            days_pregnant: this.daysPregnant,
            transponder_code: this.transponderCode,
            dam_tag: this.damTag,
            sire_tag: this.sireTag,
            group_name: this.groupName,
            dim: this.dim,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }
}
