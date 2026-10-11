import test from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateDIM,
    calculateExpectedCalvingDate,
    calculateDryOffDate,
    isMilkWithholdingActive,
    determinePhysiologicalStatus
} from '../functions/api/zootech.js';

test('1. calculateDIM (Days in Milk)', async (t) => {
    await t.test('calculates correct DIM for recent calving', () => {
        const calving = '2026-05-01';
        const today = '2026-05-11';
        assert.equal(calculateDIM(calving, today), 10);
    });

    await t.test('returns 0 for calving today', () => {
        const today = '2026-06-15';
        assert.equal(calculateDIM(today, today), 0);
    });

    await t.test('returns null for future date or null', () => {
        assert.equal(calculateDIM('2026-12-01', '2026-06-01'), null);
        assert.equal(calculateDIM(null), null);
        assert.equal(calculateDIM('invalid-date'), null);
    });
});

test('2. calculateExpectedCalvingDate (ECI target)', async (t) => {
    await t.test('adds standard 280 days gestation period', () => {
        const insDate = '2026-01-01';
        // 2026 is not a leap year, 280 days from Jan 1 = Oct 8
        const expected = calculateExpectedCalvingDate(insDate);
        assert.equal(expected, '2026-10-08');
    });

    await t.test('handles invalid inputs gracefully', () => {
        assert.equal(calculateExpectedCalvingDate(null), null);
        assert.equal(calculateExpectedCalvingDate(''), null);
    });
});

test('3. calculateDryOffDate (60-day dry period)', async (t) => {
    await t.test('calculates dry-off 60 days before calving', () => {
        const calvingDate = '2026-10-08';
        const dryDate = calculateDryOffDate(calvingDate, 60);
        assert.equal(dryDate, '2026-08-09');
    });
});

test('4. isMilkWithholdingActive (Antibiotic Quarantine)', async (t) => {
    await t.test('returns true when withholding date is today or future', () => {
        const today = '2026-10-11';
        assert.equal(isMilkWithholdingActive('2026-10-15', today), true);
        assert.equal(isMilkWithholdingActive('2026-10-11', today), true);
    });

    await t.test('returns false when withholding expired', () => {
        const today = '2026-10-11';
        assert.equal(isMilkWithholdingActive('2026-10-10', today), false);
        assert.equal(isMilkWithholdingActive(null, today), false);
    });
});

test('5. determinePhysiologicalStatus', async (t) => {
    await t.test('prioritizes quarantine over pregnancy', () => {
        const status = determinePhysiologicalStatus({
            is_quarantine: true,
            days_pregnant: 120,
            lactation_number: 2
        });
        assert.equal(status, 'Quarantine');
    });

    await t.test('identifies dry period at >= 220 days gestation', () => {
        const status = determinePhysiologicalStatus({
            days_pregnant: 230,
            lactation_number: 2
        });
        assert.equal(status, 'Dry');
    });

    await t.test('identifies heifer with 0 lactations', () => {
        const status = determinePhysiologicalStatus({
            lactation_number: 0,
            days_pregnant: 0
        });
        assert.equal(status, 'Heifer');
    });
});
