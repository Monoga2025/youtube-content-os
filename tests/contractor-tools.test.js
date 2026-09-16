'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateEmployeeCost,
  formatConsoleTable: formatEmployeeTable,
  formatCSV: formatEmployeeCSV,
  formatJSON: formatEmployeeJSON,
  STATE_TAX_PRESETS,
  FEDERAL_FICA_RATE,
  FEDERAL_FUTA_RATE
} = require('../tools/contractor-tools/employee-cost-calculator.js');

const {
  calculateJobPrice,
  formatConsoleTable: formatJobTable,
  formatCSV: formatJobCSV,
  formatJSON: formatJobJSON
} = require('../tools/contractor-tools/job-pricing-calculator.js');

// ============================================================================
// SUITE 1: EMPLOYEE COST CALCULATOR
// ============================================================================

test('employee-cost: Texas Framer / Carpenter scenario', () => {
  const result = calculateEmployeeCost({
    baseHourlyWage: 28,
    state: 'TX',
    workersCompRate: 0.11,
    payrollTaxRate: 0.085,
    downtimeHoursPerWeek: 5,
    weeklyPaidHours: 40,
    weeksPerYear: 52,
    paidTimeOffHours: 80,
    allocatedOverheadWeekly: 150,
    benefitsMonthly: 0
  });

  assert.equal(result.inputs.baseHourlyWage, 28);
  assert.equal(result.inputs.state, 'TX');
  assert.equal(result.hours.totalPaidHoursPerYear, 2080);
  assert.equal(result.costs.grossAnnualWages, 58240);

  // Expected Taxes: 58,240 * 0.085 = 4,950.40
  assert.equal(result.costs.annualPayrollTaxes, 4950.40);
  // Expected Workers Comp: 58,240 * 0.11 = 6,406.40
  assert.equal(result.costs.annualWorkersComp, 6406.40);
  // Expected Overhead: 150 * 52 = 7,800.00
  assert.equal(result.costs.annualAllocatedOverhead, 7800.00);

  // Total Burden: 4,950.40 + 6,406.40 + 7,800 = 19,156.80
  assert.equal(result.costs.totalAnnualBurden, 19156.80);
  // Total Employer Cost: 58,240 + 19,156.80 = 77,396.80
  assert.equal(result.costs.totalAnnualEmployerCost, 77396.80);

  // Productive Hours: (35 * 52) - 80 = 1,820 - 80 = 1,740 hrs
  assert.equal(result.hours.annualProductiveHours, 1740);

  // True cost per productive hour: 77,396.80 / 1740 = 44.4809 -> 44.48
  assert.equal(result.metrics.trueCostPerProductiveHour, 44.48);
  assert.equal(result.metrics.costPerPaidHour, 37.21);
  assert.ok(result.metrics.trueCostPerProductiveHour > result.inputs.baseHourlyWage);
  assert.equal(result.metrics.hourlyGapVsBaseWage, 16.48);
});

test('employee-cost: Florida Painter / Finisher scenario', () => {
  const result = calculateEmployeeCost({
    baseHourlyWage: 22,
    state: 'FL',
    workersCompRate: 0.065,
    payrollTaxRate: 0.082,
    downtimeHoursPerWeek: 4,
    weeklyPaidHours: 40,
    weeksPerYear: 52,
    paidTimeOffHours: 40,
    allocatedOverheadWeekly: 80,
    benefitsMonthly: 150
  });

  assert.equal(result.inputs.baseHourlyWage, 22);
  assert.equal(result.costs.grossAnnualWages, 45760); // 22 * 2080
  assert.equal(result.costs.annualBenefits, 1800); // 150 * 12
  assert.equal(result.costs.annualAllocatedOverhead, 4160); // 80 * 52

  // Productive Hours: (36 * 52) - 40 = 1872 - 40 = 1832
  assert.equal(result.hours.annualProductiveHours, 1832);
  assert.ok(result.metrics.trueCostPerProductiveHour > 22);
  assert.ok(result.metrics.laborBurdenMultiplier > 1.2);
});

test('employee-cost: State presets resolution (TX, FL, CA)', () => {
  const tx = calculateEmployeeCost({ baseHourlyWage: 25, state: 'TX' });
  assert.equal(tx.inputs.state, 'TX');
  assert.equal(tx.inputs.workersCompRate, STATE_TAX_PRESETS.TX.typicalWorkersCompRate);
  assert.equal(tx.inputs.payrollTaxRate, 0.0825 + STATE_TAX_PRESETS.TX.sutaRate);

  const ca = calculateEmployeeCost({ baseHourlyWage: 30, state: 'CA' });
  assert.equal(ca.inputs.state, 'CA');
  assert.equal(ca.inputs.workersCompRate, STATE_TAX_PRESETS.CA.typicalWorkersCompRate);
});

test('employee-cost: Mathematical invariants hold true', () => {
  const res = calculateEmployeeCost({
    baseHourlyWage: 32.50,
    downtimeHoursPerWeek: 6,
    paidTimeOffHours: 120,
    benefitsMonthly: 350,
    allocatedOverheadWeekly: 200,
    workersCompRate: 0.09,
    payrollTaxRate: 0.095
  });

  // Invariant 1: Total Employer Cost = Gross Wages + Total Burden
  const expectedTotalCost = Math.round((res.costs.grossAnnualWages + res.costs.totalAnnualBurden) * 100) / 100;
  assert.equal(res.costs.totalAnnualEmployerCost, expectedTotalCost);

  // Invariant 2: Cost Per Paid Hour * Total Paid Hours = Total Employer Cost
  const totalPaidHourCheck = Math.round(res.metrics.costPerPaidHour * res.hours.totalPaidHoursPerYear);
  assert.ok(Math.abs(totalPaidHourCheck - res.costs.totalAnnualEmployerCost) <= 25); // rounding tolerance

  // Invariant 3: True Cost Per Productive Hour * Productive Hours = Total Employer Cost
  const productiveHourCheck = Math.round(res.metrics.trueCostPerProductiveHour * res.hours.annualProductiveHours);
  assert.ok(Math.abs(productiveHourCheck - res.costs.totalAnnualEmployerCost) <= 25);

  // Invariant 4: True Cost Per Productive Hour is strictly greater than Cost Per Paid Hour
  assert.ok(res.metrics.trueCostPerProductiveHour > res.metrics.costPerPaidHour);
});

test('employee-cost: Input validation throws on invalid values', () => {
  assert.throws(() => calculateEmployeeCost({ baseHourlyWage: -10 }), /baseHourlyWage must be a positive number/);
  assert.throws(() => calculateEmployeeCost({ baseHourlyWage: 0 }), /baseHourlyWage must be a positive number/);
  assert.throws(() => calculateEmployeeCost({ baseHourlyWage: 25, weeklyPaidHours: 0 }), /weeklyPaidHours must be greater than 0/);
  assert.throws(() => calculateEmployeeCost({ baseHourlyWage: 25, downtimeHoursPerWeek: 40 }), /downtimeHoursPerWeek must be between 0/);
  assert.throws(() => calculateEmployeeCost({ baseHourlyWage: 25, workersCompRate: -0.05 }), /cannot be negative/);
});

test('employee-cost: Export formats (Table, CSV, JSON)', () => {
  const res = calculateEmployeeCost({ baseHourlyWage: 25 });
  const table = formatEmployeeTable(res);
  assert.ok(table.includes('CONTRACTOR EMPLOYEE TRUE COST'));
  assert.ok(table.includes('TRUE COST PER BILLABLE HR'));

  const csv = formatEmployeeCSV(res);
  assert.ok(csv.includes('"Base Hourly Wage","25"'));
  assert.ok(csv.includes('"Metric Category","Metric Name"'));

  const jsonStr = formatEmployeeJSON(res);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.inputs.baseHourlyWage, 25);
  assert.ok(parsed.metrics.trueCostPerProductiveHour > 25);
});

// ============================================================================
// SUITE 2: JOB PRICING CALCULATOR
// ============================================================================

test('job-pricing: Commercial HVAC Project scenario', () => {
  const result = calculateJobPrice({
    jobName: 'Commercial HVAC Project',
    materialsCost: 15000,
    materialsWasteRate: 0,
    laborHours: 120,
    laborHourlyRate: 48, // true burdened hourly cost
    subcontractorCost: 6500,
    equipmentAndPermitsCost: 1200,
    contingencyRate: 0,
    overheadRate: 0.15,
    targetNetMarginRate: 0.20
  });

  assert.equal(result.jobName, 'Commercial HVAC Project');
  // Direct Costs: 15,000 + (120 * 48 = 5,760) + 6,500 + 1,200 = 28,460
  assert.equal(result.summary.directCosts, 28460);
  // Overhead (15% of direct costs): 28,460 * 0.15 = 4,269
  assert.equal(result.summary.allocatedOverhead, 4269);
  // Fully Burdened Cost: 28,460 + 4,269 = 32,729
  assert.equal(result.summary.fullyBurdenedCost, 32729);
  assert.equal(result.summary.breakEvenPrice, 32729);

  // Target Selling Price: 32,729 / (1 - 0.20) = 40,911.25
  assert.equal(result.summary.targetSellingPrice, 40911.25);
  // Target Net Profit: 40,911.25 - 32,729 = 8,182.25
  assert.equal(result.summary.targetNetProfit, 8182.25);
  assert.equal(result.summary.targetNetMarginPercent, 20.0);

  // Required Markup on Total Cost: 0.20 / (1 - 0.20) = 0.25 (25%)
  assert.equal(result.summary.requiredMarkupOnTotalCostPercent, 25.0);
});

test('job-pricing: Detailed crew labor items and material waste buffer', () => {
  const result = calculateJobPrice({
    jobName: 'Luxury Bathroom Remodel',
    materialsCost: 5000,
    materialsWasteRate: 0.10, // 10% scrap allowance -> $5,500
    labor: [
      { role: 'Master Carpenter', hours: 40, hourlyCost: 45 },
      { role: 'Apprentice Tile Setter', hours: 30, hourlyCost: 28 }
    ],
    subcontractors: [
      { trade: 'Licensed Plumber', cost: 2400, markupRate: 0.15 },
      { trade: 'Electrician', cost: 1400, markupRate: 0.10 }
    ],
    equipmentAndPermitsCost: 600,
    contingencyRate: 0.05,
    overheadRate: 0.12,
    targetNetMarginRate: 0.25
  });

  assert.equal(result.costBreakdown.materials.wasteAmount, 500);
  assert.equal(result.costBreakdown.materials.totalDirectMaterialsCost, 5500);

  // Labor: (40 * 45 = 1800) + (30 * 28 = 840) = 2640
  assert.equal(result.costBreakdown.labor.totalLaborCost, 2640);
  assert.equal(result.costBreakdown.labor.totalHours, 70);

  // Subcontractors: 2400 + 1400 = 3800
  assert.equal(result.costBreakdown.subcontractors.totalSubcontractorCost, 3800);

  // Base Direct Costs: 5500 + 2640 + 3800 + 600 = 12,540
  // Contingency 5%: 12,540 * 0.05 = 627
  // Total Direct: 13,167
  assert.equal(result.summary.directCosts, 13167);

  // Overhead (12%): 13,167 * 0.12 = 1,580.04
  // Fully Burdened Cost: 13,167 + 1,580.04 = 14,747.04
  assert.equal(result.summary.fullyBurdenedCost, 14747.04);

  // Target Selling Price: 14,747.04 / (1 - 0.25) = 19,662.72
  assert.equal(result.summary.targetSellingPrice, 19662.72);
  assert.equal(result.summary.targetNetMarginPercent, 25.0);
  assert.equal(result.summary.requiredMarkupOnTotalCostPercent, 33.33); // 25 / (1 - 0.25) = 33.33%
});

test('job-pricing: Break-even invariant (at 0% profit, Selling Price equals Total Cost)', () => {
  const result = calculateJobPrice({
    materialsCost: 8000,
    laborHours: 50,
    laborHourlyRate: 40,
    overheadRate: 0.10,
    targetNetMarginRate: 0
  });

  assert.equal(result.summary.targetNetProfit, 0);
  assert.equal(result.summary.targetSellingPrice, result.summary.breakEvenPrice);
  assert.equal(result.summary.targetSellingPrice, result.summary.fullyBurdenedCost);
});

test('job-pricing: Percent of revenue overhead calculation method', () => {
  const result = calculateJobPrice({
    materialsCost: 6000,
    laborHours: 40,
    laborHourlyRate: 50,
    overheadMethod: 'percentOfRevenue',
    overheadRate: 0.15, // 15% of revenue
    targetNetMarginRate: 0.20 // 20% of revenue
  });

  // Direct Costs = 6000 + 2000 = 8000
  // Selling Price = 8000 / (1 - 0.15 - 0.20) = 8000 / 0.65 = 12,307.69
  assert.equal(result.summary.directCosts, 8000);
  assert.equal(result.summary.targetSellingPrice, 12307.69);
  // Overhead: 12,307.69 * 0.15 = 1,846.15
  assert.equal(result.summary.allocatedOverhead, 1846.15);
  // Net Profit: 12,307.69 * 0.20 = 2,461.54
  assert.equal(result.summary.targetNetProfit, 2461.54);
  assert.equal(result.summary.targetNetMarginPercent, 20.0);
});

test('job-pricing: Sensitivity analysis computes realistic slippage', () => {
  const result = calculateJobPrice({
    materialsCost: 10000,
    laborHours: 100,
    laborHourlyRate: 40, // $4,000 labor
    overheadRate: 0.10,
    targetNetMarginRate: 0.20
  });

  assert.equal(result.sensitivity.length, 5);
  const baseline = result.sensitivity[0];
  const labor20Overrun = result.sensitivity[2];

  assert.equal(baseline.scenario, 'On Schedule / Exact Plan');
  assert.equal(baseline.revisedNetMarginPercent, 20.0);

  // In labor +20% overrun, extra labor cost = $4000 * 0.20 = $800
  // Profit erosion should be exactly $800
  assert.equal(labor20Overrun.profitErosionVsPlan, 800);
  assert.ok(labor20Overrun.revisedNetProfit < baseline.revisedNetProfit);
  assert.ok(labor20Overrun.revisedNetMarginPercent < 20.0);
});

test('job-pricing: Input validation and bounds checking', () => {
  // Target margin >= 1.0 (100%) must throw
  assert.throws(() => calculateJobPrice({ targetNetMarginRate: 1.0 }), /must be >= 0 and strictly less than 1.0/);
  assert.throws(() => calculateJobPrice({ targetNetMarginRate: 1.2 }), /must be >= 0 and strictly less than 1.0/);
  assert.throws(() => calculateJobPrice({ targetNetMarginRate: -0.1 }), /must be >= 0 and strictly less than 1.0/);
  assert.throws(() => calculateJobPrice({ materialsCost: -500 }), /materialsCost cannot be negative/);
});

test('job-pricing: Export formats (Table, CSV, JSON)', () => {
  const result = calculateJobPrice({ materialsCost: 5000, laborHours: 20, laborHourlyRate: 35 });
  const table = formatJobTable(result);
  assert.ok(table.includes('CONTRACTOR JOB PRICING & BID REPORT'));
  assert.ok(table.includes('BREAK-EVEN BID PRICE'));
  assert.ok(table.includes('TARGET SELLING PRICE BID'));

  const csv = formatJobCSV(result);
  assert.ok(csv.includes('"Target Selling Price"'));
  assert.ok(csv.includes('"Fully Burdened Cost"'));

  const jsonStr = formatJobJSON(result);
  const parsed = JSON.parse(jsonStr);
  assert.ok(parsed.summary.targetSellingPrice > 0);
  assert.ok(parsed.marginVsMarkupExplanation.rule.length > 0);
});

// ============================================================================
// SUITE 3: END-TO-END PIPELINE (EMPLOYEE TRUE COST -> JOB PRICING BID)
// ============================================================================

test('e2e: employee true cost pipes directly into contractor job bid', () => {
  // Step 1: Calculate Lead Carpenter True Cost
  const leadCarpenter = calculateEmployeeCost({
    baseHourlyWage: 30,
    state: 'FL',
    downtimeHoursPerWeek: 5,
    allocatedOverheadWeekly: 140,
    paidTimeOffHours: 80
  });

  // Step 2: Calculate Apprentice True Cost
  const apprentice = calculateEmployeeCost({
    baseHourlyWage: 18,
    state: 'FL',
    downtimeHoursPerWeek: 4,
    allocatedOverheadWeekly: 60,
    paidTimeOffHours: 40
  });

  assert.ok(leadCarpenter.metrics.trueCostPerProductiveHour > 30);
  assert.ok(apprentice.metrics.trueCostPerProductiveHour > 18);

  // Step 3: Use both true rates in job pricing bid
  const project = calculateJobPrice({
    jobName: 'Complete Kitchen Modernization',
    materialsCost: 12000,
    materialsWasteRate: 0.08,
    labor: [
      {
        role: 'Lead Carpenter',
        hours: 60,
        hourlyCost: leadCarpenter.metrics.trueCostPerProductiveHour
      },
      {
        role: 'Apprentice',
        hours: 45,
        hourlyCost: apprentice.metrics.trueCostPerProductiveHour
      }
    ],
    subcontractors: [
      { trade: 'Countertop Fabrication', cost: 4200, markupRate: 0.12 }
    ],
    equipmentAndPermitsCost: 850,
    overheadRate: 0.15,
    targetNetMarginRate: 0.22
  });

  // Invariant assertions
  assert.ok(project.summary.targetSellingPrice > project.summary.breakEvenPrice);
  assert.equal(project.summary.targetNetMarginPercent, 22.0);
  assert.ok(project.summary.targetGrossMarginPercent > project.summary.targetNetMarginPercent);
  assert.equal(project.costBreakdown.labor.items.length, 2);
  assert.equal(project.costBreakdown.labor.items[0].hourlyCost, leadCarpenter.metrics.trueCostPerProductiveHour);
  assert.equal(project.costBreakdown.labor.items[1].hourlyCost, apprentice.metrics.trueCostPerProductiveHour);
});
