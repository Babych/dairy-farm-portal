// Pure zootechnical calculation engine and biological status rules
// Independent of D1 database, fully unit-testable

export function calculateDIM(calvingDate, referenceDate = new Date()) {
    if (!calvingDate) return null;
    const calving = new Date(calvingDate);
    const ref = new Date(referenceDate);
    if (isNaN(calving.getTime()) || isNaN(ref.getTime())) return null;
    
    // Difference in whole calendar days
    const diffTime = ref.getTime() - calving.getTime();
    if (diffTime < 0) return null;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export function calculateExpectedCalvingDate(inseminationDate, gestationDays = 280) {
    if (!inseminationDate) return null;
    const [y, m, d] = inseminationDate.split('-').map(Number);
    if (!y || !m || !d) return null;
    
    const expected = new Date(Date.UTC(y, m - 1, d + gestationDays));
    return expected.toISOString().split('T')[0];
}

export function calculateDryOffDate(expectedCalvingDate, dryPeriodDays = 60) {
    if (!expectedCalvingDate) return null;
    const [y, m, d] = expectedCalvingDate.split('-').map(Number);
    if (!y || !m || !d) return null;
    
    const dryDate = new Date(Date.UTC(y, m - 1, d - dryPeriodDays));
    return dryDate.toISOString().split('T')[0];
}

export function isMilkWithholdingActive(withholdingUntil, referenceDate = new Date()) {
    if (!withholdingUntil) return false;
    const until = new Date(withholdingUntil);
    const ref = new Date(referenceDate);
    if (isNaN(until.getTime()) || isNaN(ref.getTime())) return false;
    
    const todayStr = ref.toISOString().split('T')[0];
    const untilStr = until.toISOString().split('T')[0];
    return untilStr >= todayStr;
}

export function determinePhysiologicalStatus(animal, activeHealthEvents = []) {
    // 1. Safety check for antibiotic/medication quarantine
    if (animal.is_quarantine) return 'Quarantine';
    const hasActiveQuarantine = activeHealthEvents.some(h => 
        h.is_active_withholding === 1 || isMilkWithholdingActive(h.milk_withholding_until)
    );
    if (hasActiveQuarantine) {
        return 'Quarantine';
    }

    // 2. Status inference from reproduction data
    if (animal.days_pregnant >= 220) {
        return 'Dry';
    }
    if (animal.days_pregnant >= 35) {
        return 'Pregnant';
    }

    // 3. Check explicitly stored status
    if (animal.current_status) {
        return animal.current_status;
    }

    if (animal.last_insemination_date) {
        return 'Inseminated';
    }
    if (animal.last_calving_date) {
        const dim = calculateDIM(animal.last_calving_date);
        if (dim !== null && dim <= 21) return 'Fresh';
        return 'Active';
    }

    return animal.lactation_number === 0 ? 'Heifer' : 'Open';
}
