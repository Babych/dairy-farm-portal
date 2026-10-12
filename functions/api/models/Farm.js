// Domain Model: Farm
// Standardizes database row into clean, predictable domain entity

export class Farm {
    constructor(row = {}) {
        this.id = row.id || null;
        this.code = row.code || '';
        this.name = (row.name || 'Моя ферма').trim();
        this.farmerName = row.farmer_name || null;
        this.address = row.address || null;
        this.city = row.city || null;
        this.phone = row.phone || null;
        this.ownerEmail = row.owner_email || null;
        this.cowCount = Number.isInteger(Number(row.cow_count)) ? Number(row.cow_count) : 0;
        this.isCurrent = Boolean(row.is_current);
        this.createdAt = row.created_at || null;
        this.importedAt = row.imported_at || null;
    }

    /**
     * Serializes to standardized API JSON format (compatible with frontend contract)
     */
    toJSON() {
        return {
            id: this.id,
            code: this.code,
            name: this.name,
            farmer_name: this.farmerName,
            address: this.address,
            city: this.city,
            phone: this.phone,
            owner_email: this.ownerEmail,
            cow_count: this.cowCount,
            is_current: this.isCurrent ? 1 : 0,
            created_at: this.createdAt,
            imported_at: this.importedAt
        };
    }
}
