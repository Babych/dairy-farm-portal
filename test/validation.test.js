import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateFarmInput, validateAnimalInput, validateReproEventInput, validateHealthEventInput } from '../functions/api/validation.js';

describe('API Input Validation & Schema Integrity Suite', () => {
    describe('1. validateFarmInput', () => {
        it('accepts valid farm payload and trims inputs', () => {
            const input = {
                name: '  ПП Західний Лан  ',
                farmer_name: ' Степан ',
                city: 'Львів',
                phone: '+380501234567'
            };
            const res = validateFarmInput(input);
            assert.strictEqual(res.isValid, true);
            assert.strictEqual(res.sanitized.name, 'ПП Західний Лан');
            assert.strictEqual(res.sanitized.farmer_name, 'Степан');
        });

        it('rejects empty or whitespace-only farm name', () => {
            const res = validateFarmInput({ name: '   ' });
            assert.strictEqual(res.isValid, false);
            assert.ok(res.errors[0].includes('Farm name is required'));
        });

        it('rejects excessively long phone numbers', () => {
            const res = validateFarmInput({ name: 'Ферма', phone: '1'.repeat(60) });
            assert.strictEqual(res.isValid, false);
            assert.ok(res.errors[0].includes('Phone number cannot exceed'));
        });
    });

    describe('2. validateAnimalInput', () => {
        it('accepts valid animal payload with standard status', () => {
            const input = {
                farm_number: '1042',
                official_tag: 'UA 8000 1234',
                current_status: 'Pregnant',
                birth_date: '2023-01-15'
            };
            const res = validateAnimalInput(input);
            assert.strictEqual(res.isValid, true);
            assert.strictEqual(res.sanitized.farm_number, '1042');
            assert.strictEqual(res.sanitized.current_status, 'Pregnant');
        });

        it('rejects animal without working number', () => {
            const res = validateAnimalInput({ name: 'Зірка' });
            assert.strictEqual(res.isValid, false);
            assert.ok(res.errors[0].includes('farm number'));
        });

        it('rejects invalid status', () => {
            const res = validateAnimalInput({ farm_number: '101', current_status: 'Alien' });
            assert.strictEqual(res.isValid, false);
            assert.ok(res.errors[0].includes("Invalid animal status 'Alien'"));
        });

        it('rejects invalid birth date string', () => {
            const res = validateAnimalInput({ farm_number: '101', birth_date: 'not-a-date' });
            assert.strictEqual(res.isValid, false);
            assert.ok(res.errors[0].includes('birth_date'));
        });
    });

    describe('3. validateReproEventInput', () => {
        it('accepts valid INSEMINATION event', () => {
            const input = {
                event_type: 'insemination',
                event_date: '2026-05-10',
                bull_code: 'UA9988'
            };
            const res = validateReproEventInput(input);
            assert.strictEqual(res.isValid, true);
            assert.strictEqual(res.sanitized.event_type, 'INSEMINATION');
            assert.strictEqual(res.sanitized.bull_code, 'UA9988');
        });

        it('rejects unsupported event type', () => {
            const res = validateReproEventInput({ event_type: 'FLYING', event_date: '2026-05-10' });
            assert.strictEqual(res.isValid, false);
            assert.ok(res.errors[0].includes('Invalid event_type'));
        });

        it('rejects missing event_date', () => {
            const res = validateReproEventInput({ event_type: 'HEAT' });
            assert.strictEqual(res.isValid, false);
            assert.ok(res.errors[0].includes('event_date is required'));
        });
    });

    describe('4. validateHealthEventInput', () => {
        it('accepts valid health event with antibiotic quarantine', () => {
            const input = {
                diagnosis: 'Гострий мастит',
                event_date: '2026-05-15',
                medication_name: 'Кобактан',
                dosage: '10 мл',
                milk_withholding_until: '2026-05-20',
                is_active_withholding: true
            };
            const res = validateHealthEventInput(input);
            assert.strictEqual(res.isValid, true);
            assert.strictEqual(res.sanitized.diagnosis, 'Гострий мастит');
            assert.strictEqual(res.sanitized.is_active_withholding, 1);
        });

        it('rejects missing diagnosis', () => {
            const res = validateHealthEventInput({ event_date: '2026-05-15' });
            assert.strictEqual(res.isValid, false);
            assert.ok(res.errors[0].includes('Diagnosis is required'));
        });

        it('rejects missing or invalid event_date', () => {
            const res = validateHealthEventInput({ diagnosis: 'Кульгавість', event_date: 'invalid' });
            assert.strictEqual(res.isValid, false);
            assert.ok(res.errors[0].includes('event_date is required'));
        });
    });
});

