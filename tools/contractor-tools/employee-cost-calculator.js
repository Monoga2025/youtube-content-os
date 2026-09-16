'use strict';

/**
 * STATE TAX PRESETS (USA)
 * Standard State Unemployment Tax Act (SUTA) and mandatory statutory ranges.
 * Note: SUTA varies by employer experience rating; these are typical construction sector medians.
 */
const STATE_TAX_PRESETS = {
  TX: { name: 'Texas', sutaRate: 0.027, hasStateIncomeTax: false, typicalWorkersCompRate: 0.085 },
  FL: { name: 'Florida', sutaRate: 0.027, hasStateIncomeTax: false, typicalWorkersCompRate: 0.078 },
  CA: { name: 'California', sutaRate: 0.034, hasStateIncomeTax: true, typicalWorkersCompRate: 0.115 },
  NY: { name: 'New York', sutaRate: 0.041, hasStateIncomeTax: true, typicalWorkersCompRate: 0.120 },
  NC: { name: 'North Carolina', sutaRate: 0.025, hasStateIncomeTax: true, typicalWorkersCompRate: 0.072 },
  GA: { name: 'Georgia', sutaRate: 0.027, hasStateIncomeTax: true, typicalWorkersCompRate: 0.075 },
  AZ: { name: 'Arizona', sutaRate: 0.024, hasStateIncomeTax: true, typicalWorkersCompRate: 0.080 },
  CO: { name: 'Colorado', sutaRate: 0.029, hasStateIncomeTax: true, typicalWorkersCompRate: 0.082 },
  OH: { name: 'Ohio', sutaRate: 0.027, hasStateIncomeTax: true, typicalWorkersCompRate: 0.085 },
  IL: { name: 'Illinois', sutaRate: 0.039, hasStateIncomeTax: true, typicalWorkersCompRate: 0.098 }
};

// Federal FICA (Social Security 6.2% + Medicare 1.45%) = 7.65%
const FEDERAL_FICA_RATE = 0.0765;
// Federal Unemployment Tax Act (FUTA) effective after standard state credit = 0.6%
const FEDERAL_FUTA_RATE = 0.006;
const DEFAULT_FEDERAL_PAYROLL_TAX_RATE = FEDERAL_FICA_RATE + FEDERAL_FUTA_RATE; // 0.0825 (8.25%)

/**
 * Calculates the exact labor burden and true hourly productive cost of an employee.
 * 
 * @param {Object} params
 * @param {number} params.baseHourlyWage - Hourly nominal wage ($/hr)
 * @param {string} [params.state] - State code (e.g. 'FL', 'TX', 'CA')
 * @param {number} [params.workersCompRate] - Workers compensation insurance rate (0.08 = 8%)
 * @param {number} [params.payrollTaxRate] - Total payroll taxes rate (FICA + SUTA + FUTA)
 * @param {number} [params.downtimeHoursPerWeek=5] - Unbilled hours per week (travel, shop maintenance, morning meetings)
 * @param {number} [params.weeklyPaidHours=40] - Hours paid per week
 * @param {number} [params.weeksPerYear=52] - Weeks paid per year
 * @param {number} [params.paidTimeOffHours=80] - Paid vacation, holidays, sick days per year (hours)
 * @param {number} [params.benefitsMonthly=0] - Health, dental, life, retirement monthly allowance ($/mo)
 * @param {number} [params.allocatedOverheadWeekly=0] - Assigned tools, fuel, vehicle wear, uniform per week ($/wk)
 * @param {number} [params.overtimeHoursWeekly=0] - Average overtime hours per week
 * @param {number} [params.overtimeMultiplier=1.5] - Overtime pay multiplier
 * @returns {Object} Complete calculation breakdown
 */
function calculateEmployeeCost(params = {}) {
  const baseHourlyWage = Number(params.baseHourlyWage);
  if (isNaN(baseHourlyWage) || baseHourlyWage <= 0) {
    throw new Error('baseHourlyWage must be a positive number');
  }

  const weeklyPaidHours = Number(params.weeklyPaidHours ?? 40);
  const weeksPerYear = Number(params.weeksPerYear ?? 52);
  const downtimeHoursPerWeek = Number(params.downtimeHoursPerWeek ?? 0);
  const paidTimeOffHours = Number(params.paidTimeOffHours ?? 0);
  const benefitsMonthly = Number(params.benefitsMonthly ?? 0);
  const allocatedOverheadWeekly = Number(params.allocatedOverheadWeekly ?? 0);
  const overtimeHoursWeekly = Number(params.overtimeHoursWeekly ?? 0);
  const overtimeMultiplier = Number(params.overtimeMultiplier ?? 1.5);

  if (weeklyPaidHours <= 0) throw new Error('weeklyPaidHours must be greater than 0');
  if (downtimeHoursPerWeek < 0 || downtimeHoursPerWeek >= weeklyPaidHours) {
    throw new Error('downtimeHoursPerWeek must be between 0 and less than weeklyPaidHours');
  }

  const stateCode = params.state ? String(params.state).trim().toUpperCase() : null;
  const statePreset = stateCode && STATE_TAX_PRESETS[stateCode] ? STATE_TAX_PRESETS[stateCode] : null;

  // Resolve payroll tax rate
  let payrollTaxRate;
  if (params.payrollTaxRate !== undefined && params.payrollTaxRate !== null) {
    payrollTaxRate = Number(params.payrollTaxRate);
  } else if (statePreset) {
    payrollTaxRate = DEFAULT_FEDERAL_PAYROLL_TAX_RATE + statePreset.sutaRate;
  } else {
    payrollTaxRate = DEFAULT_FEDERAL_PAYROLL_TAX_RATE; // 8.25% default
  }

  // Resolve workers comp rate
  let workersCompRate;
  if (params.workersCompRate !== undefined && params.workersCompRate !== null) {
    workersCompRate = Number(params.workersCompRate);
  } else if (statePreset) {
    workersCompRate = statePreset.typicalWorkersCompRate;
  } else {
    workersCompRate = 0.08; // 8% standard construction benchmark
  }

  if (payrollTaxRate < 0 || workersCompRate < 0) {
    throw new Error('Tax and insurance rates cannot be negative');
  }

  // 1. Gross Wage Calculations
  const regularAnnualHours = weeklyPaidHours * weeksPerYear;
  const regularAnnualWages = regularAnnualHours * baseHourlyWage;
  const overtimeAnnualHours = overtimeHoursWeekly * weeksPerYear;
  const overtimeHourlyWage = baseHourlyWage * overtimeMultiplier;
  const overtimeAnnualWages = overtimeAnnualHours * overtimeHourlyWage;

  const totalPaidHoursPerYear = regularAnnualHours + overtimeAnnualHours;
  const grossAnnualWages = regularAnnualWages + overtimeAnnualWages;
  const grossWeeklyWages = grossAnnualWages / weeksPerYear;

  // 2. Burden Cost Calculations
  const annualPayrollTaxes = grossAnnualWages * payrollTaxRate;
  const annualWorkersComp = grossAnnualWages * workersCompRate;
  const annualBenefits = benefitsMonthly * 12;
  const annualOverhead = allocatedOverheadWeekly * weeksPerYear;

  const totalAnnualBurden = annualPayrollTaxes + annualWorkersComp + annualBenefits + annualOverhead;
  const totalAnnualEmployerCost = grossAnnualWages + totalAnnualBurden;

  // 3. Productive Hours vs Paid Hours
  // Productive hours per week = paid base hours minus non-billable downtime
  const weeklyProductiveHours = (weeklyPaidHours - downtimeHoursPerWeek) + overtimeHoursWeekly;
  const annualProductiveHoursRaw = weeklyProductiveHours * weeksPerYear;
  // Subtract PTO (vacation, holidays, sick days where employee is paid but generates zero job hours)
  const annualProductiveHours = Math.max(1, annualProductiveHoursRaw - paidTimeOffHours);

  // 4. Rate Benchmarks
  const costPerPaidHour = totalAnnualEmployerCost / totalPaidHoursPerYear;
  const trueCostPerProductiveHour = totalAnnualEmployerCost / annualProductiveHours;

  // Burden Multiplier & Markup
  const laborBurdenRate = totalAnnualBurden / grossAnnualWages;
  const laborBurdenMultiplier = totalAnnualEmployerCost / grossAnnualWages;
  const effectiveCostMultiplierOnBaseWage = trueCostPerProductiveHour / baseHourlyWage;

  return {
    inputs: {
      baseHourlyWage: round(baseHourlyWage, 2),
      state: stateCode || 'CUSTOM/OTHER',
      stateName: statePreset ? statePreset.name : 'Custom / Unspecified',
      weeklyPaidHours,
      weeksPerYear,
      downtimeHoursPerWeek,
      paidTimeOffHours,
      workersCompRate: round(workersCompRate, 4),
      payrollTaxRate: round(payrollTaxRate, 4),
      benefitsMonthly: round(benefitsMonthly, 2),
      allocatedOverheadWeekly: round(allocatedOverheadWeekly, 2),
      overtimeHoursWeekly,
      overtimeMultiplier
    },
    hours: {
      totalPaidHoursPerYear: round(totalPaidHoursPerYear, 1),
      paidTimeOffHours: round(paidTimeOffHours, 1),
      weeklyDowntimeHours: round(downtimeHoursPerWeek, 1),
      annualDowntimeHours: round(downtimeHoursPerWeek * weeksPerYear, 1),
      annualProductiveHours: round(annualProductiveHours, 1),
      productivityRatio: round(annualProductiveHours / totalPaidHoursPerYear, 4)
    },
    costs: {
      grossAnnualWages: round(grossAnnualWages, 2),
      grossWeeklyWages: round(grossWeeklyWages, 2),
      annualPayrollTaxes: round(annualPayrollTaxes, 2),
      annualWorkersComp: round(annualWorkersComp, 2),
      annualBenefits: round(annualBenefits, 2),
      annualAllocatedOverhead: round(annualOverhead, 2),
      totalAnnualBurden: round(totalAnnualBurden, 2),
      totalAnnualEmployerCost: round(totalAnnualEmployerCost, 2)
    },
    metrics: {
      baseWagePerHour: round(baseHourlyWage, 2),
      costPerPaidHour: round(costPerPaidHour, 2),
      trueCostPerProductiveHour: round(trueCostPerProductiveHour, 2),
      laborBurdenRatePercent: round(laborBurdenRate * 100, 2),
      laborBurdenMultiplier: round(laborBurdenMultiplier, 3),
      effectiveMultiplierOnBaseWage: round(effectiveCostMultiplierOnBaseWage, 3),
      hourlyGapVsBaseWage: round(trueCostPerProductiveHour - baseHourlyWage, 2)
    }
  };
}

function round(val, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Format calculation result to console ASCII table
 */
function formatConsoleTable(result) {
  const m = result.metrics;
  const c = result.costs;
  const h = result.hours;
  const i = result.inputs;

  const lines = [
    '========================================================================',
    '         CONTRACTOR EMPLOYEE TRUE COST & LABOR BURDEN REPORT            ',
    '========================================================================',
    ` Location / State       : ${i.state} (${i.stateName})`,
    ` Base Hourly Wage       : $${i.baseHourlyWage.toFixed(2)}/hr`,
    ` Paid Hours / Week      : ${i.weeklyPaidHours} hrs (${i.weeksPerYear} weeks/yr = ${h.totalPaidHoursPerYear} hrs)`,
    ` Non-Billable Downtime  : ${i.downtimeHoursPerWeek} hrs/week (${h.annualDowntimeHours} hrs/yr unbilled)`,
    ` Paid Time Off (PTO)    : ${i.paidTimeOffHours} hrs/year`,
    ` Net Productive Hours   : ${h.annualProductiveHours} hrs/yr (${(h.productivityRatio * 100).toFixed(1)}% billable efficiency)`,
    '------------------------------------------------------------------------',
    ' ANNUAL COST BREAKDOWN (EMPLOYER EXPENDITURE)',
    '------------------------------------------------------------------------',
    ` 1. Gross Wages Paid             : $${c.grossAnnualWages.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ` 2. Payroll Taxes (FICA+SUTA)    : $${c.annualPayrollTaxes.toLocaleString('en-US', { minimumFractionDigits: 2 })}  (${(i.payrollTaxRate * 100).toFixed(2)}%)`,
    ` 3. Workers' Comp Insurance      : $${c.annualWorkersComp.toLocaleString('en-US', { minimumFractionDigits: 2 })}  (${(i.workersCompRate * 100).toFixed(2)}%)`,
    ` 4. Benefits (Health/Dental/401k): $${c.annualBenefits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ` 5. Tools/Vehicle/Gas Overhead   : $${c.annualAllocatedOverhead.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    '------------------------------------------------------------------------',
    ` TOTAL ANNUAL BURDEN             : $${c.totalAnnualBurden.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ` TOTAL EMPLOYER ANNUAL OUTFLOW   : $${c.totalAnnualEmployerCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    '========================================================================',
    ' CRITICAL METRICS FOR ESTIMATING & BIDDING',
    '========================================================================',
    ` Nominal Base Wage              : $${m.baseWagePerHour.toFixed(2)}/hr`,
    ` Cost Per Paid Hour             : $${m.costPerPaidHour.toFixed(2)}/hr  (Burden Multiplier: ${m.laborBurdenMultiplier}x)`,
    ` >>> TRUE COST PER BILLABLE HR  : $${m.trueCostPerProductiveHour.toFixed(2)}/hr <<<`,
    ` Hidden Cost Gap vs Base Wage   : +$${m.hourlyGapVsBaseWage.toFixed(2)}/hr (+${((m.effectiveMultiplierOnBaseWage - 1) * 100).toFixed(1)}% extra cost)`,
    '========================================================================'
  ];
  return lines.join('\n');
}

/**
 * Format calculation result to CSV string
 */
function formatCSV(result) {
  const rows = [
    ['Metric Category', 'Metric Name', 'Value', 'Unit'],
    ['Input', 'Base Hourly Wage', result.inputs.baseHourlyWage, 'USD/hr'],
    ['Input', 'State', result.inputs.state, 'Code'],
    ['Input', 'Weekly Paid Hours', result.inputs.weeklyPaidHours, 'Hours'],
    ['Input', 'Weekly Downtime Hours', result.inputs.downtimeHoursPerWeek, 'Hours'],
    ['Input', 'Annual PTO Hours', result.inputs.paidTimeOffHours, 'Hours'],
    ['Input', 'Workers Comp Rate', result.inputs.workersCompRate, 'Decimal'],
    ['Input', 'Payroll Tax Rate', result.inputs.payrollTaxRate, 'Decimal'],
    ['Input', 'Benefits Monthly', result.inputs.benefitsMonthly, 'USD/month'],
    ['Input', 'Allocated Overhead Weekly', result.inputs.allocatedOverheadWeekly, 'USD/week'],
    ['Hours', 'Total Paid Hours Per Year', result.hours.totalPaidHoursPerYear, 'Hours'],
    ['Hours', 'Annual Productive Hours', result.hours.annualProductiveHours, 'Hours'],
    ['Hours', 'Productivity Efficiency Ratio', result.hours.productivityRatio, 'Ratio'],
    ['Annual Costs', 'Gross Annual Wages', result.costs.grossAnnualWages, 'USD'],
    ['Annual Costs', 'Annual Payroll Taxes', result.costs.annualPayrollTaxes, 'USD'],
    ['Annual Costs', 'Annual Workers Comp', result.costs.annualWorkersComp, 'USD'],
    ['Annual Costs', 'Annual Benefits', result.costs.annualBenefits, 'USD'],
    ['Annual Costs', 'Annual Allocated Overhead', result.costs.annualAllocatedOverhead, 'USD'],
    ['Annual Costs', 'Total Annual Burden', result.costs.totalAnnualBurden, 'USD'],
    ['Annual Costs', 'Total Annual Employer Cost', result.costs.totalAnnualEmployerCost, 'USD'],
    ['True Rates', 'Base Wage Per Hour', result.metrics.baseWagePerHour, 'USD/hr'],
    ['True Rates', 'Cost Per Paid Hour', result.metrics.costPerPaidHour, 'USD/hr'],
    ['True Rates', 'True Cost Per Productive Hour', result.metrics.trueCostPerProductiveHour, 'USD/hr'],
    ['True Rates', 'Labor Burden Rate Percent', result.metrics.laborBurdenRatePercent, 'Percent'],
    ['True Rates', 'Labor Burden Multiplier', result.metrics.laborBurdenMultiplier, 'Multiplier'],
    ['True Rates', 'Effective Multiplier On Base', result.metrics.effectiveMultiplierOnBaseWage, 'Multiplier'],
    ['True Rates', 'Hourly Gap vs Base Wage', result.metrics.hourlyGapVsBaseWage, 'USD/hr']
  ];

  return rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
}

/**
 * Format calculation result to JSON string
 */
function formatJSON(result, pretty = true) {
  return JSON.stringify(result, null, pretty ? 2 : undefined);
}

// CLI Execution Support
if (require.main === module) {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        parsed[key] = next;
        i++;
      } else {
        parsed[key] = true;
      }
    }
  }

  const wage = parsed.wage || parsed.w || 25;
  const state = parsed.state || parsed.s || 'TX';
  const wc = parsed['workers-comp'] || parsed.wc;
  const pt = parsed['payroll-tax'] || parsed.pt;
  const downtime = parsed.downtime || parsed.d || 5;
  const overhead = parsed.overhead || parsed.o || 120;
  const benefits = parsed.benefits || parsed.b || 0;
  const pto = parsed.pto || 80;

  const res = calculateEmployeeCost({
    baseHourlyWage: parseFloat(wage),
    state: state,
    workersCompRate: wc !== undefined ? parseFloat(wc) : undefined,
    payrollTaxRate: pt !== undefined ? parseFloat(pt) : undefined,
    downtimeHoursPerWeek: parseFloat(downtime),
    allocatedOverheadWeekly: parseFloat(overhead),
    benefitsMonthly: parseFloat(benefits),
    paidTimeOffHours: parseFloat(pto)
  });

  if (parsed.json) {
    console.log(formatJSON(res));
  } else if (parsed.csv) {
    console.log(formatCSV(res));
  } else {
    console.log(formatConsoleTable(res));
  }
}

module.exports = {
  calculateEmployeeCost,
  formatConsoleTable,
  formatCSV,
  formatJSON,
  STATE_TAX_PRESETS,
  FEDERAL_FICA_RATE,
  FEDERAL_FUTA_RATE,
  DEFAULT_FEDERAL_PAYROLL_TAX_RATE
};
