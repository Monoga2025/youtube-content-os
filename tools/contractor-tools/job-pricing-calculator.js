'use strict';

/**
 * Calculates contractor job pricing, break-even threshold, target selling price,
 * and exact margin vs markup metrics with slippage sensitivity.
 *
 * @param {Object} params
 * @param {string} [params.jobName='Standard Project'] - Project or bid name
 * @param {number} [params.materialsCost=0] - Raw material estimate ($)
 * @param {number} [params.materialsWasteRate=0.10] - Allowance for scrap/waste/damage (0.10 = 10%)
 * @param {number} [params.materialsHandlingRate=0] - Additional markup specifically on materials (0.10 = 10%)
 * @param {Array<{role: string, hours: number, hourlyCost: number}>|number} [params.labor] - Labor detail array or flat total hours
 * @param {number} [params.laborHours] - Flat labor hours (if labor array not provided)
 * @param {number} [params.laborHourlyRate] - Flat labor hourly rate (true burdened cost, e.g. from employee calculator)
 * @param {Array<{trade: string, cost: number, markupRate?: number}>|number} [params.subcontractors] - Subcontractors detail array or flat cost
 * @param {number} [params.subcontractorCost] - Flat subcontractor cost (if array not provided)
 * @param {number} [params.equipmentAndPermitsCost=0] - Permits, dumpster, scaffold, rental equipment ($)
 * @param {number} [params.contingencyRate=0.05] - Unforeseen jobsite risk buffer (0.05 = 5% of direct costs)
 * @param {number} [params.overheadRate=0.15] - Company overhead rate (0.15 = 15% of direct costs, or % of revenue)
 * @param {string} [params.overheadMethod='percentOfDirectCosts'] - 'percentOfDirectCosts' or 'percentOfRevenue'
 * @param {number} [params.targetNetMarginRate=0.20] - Target Net Profit Margin (0.20 = 20% of final selling price)
 * @returns {Object} Comprehensive pricing breakdown
 */
function calculateJobPrice(params = {}) {
  const jobName = params.jobName || 'Contractor Project Bid';

  // 1. Materials
  const rawMaterials = Number(params.materialsCost ?? 0);
  if (rawMaterials < 0) throw new Error('materialsCost cannot be negative');
  const wasteRate = Number(params.materialsWasteRate ?? 0);
  const handlingRate = Number(params.materialsHandlingRate ?? 0);
  if (wasteRate < 0 || handlingRate < 0) throw new Error('Material rates cannot be negative');

  const materialsWasteAmount = rawMaterials * wasteRate;
  const materialsWithWaste = rawMaterials + materialsWasteAmount;
  const materialsHandlingFee = materialsWithWaste * handlingRate;
  const totalDirectMaterialsCost = materialsWithWaste + materialsHandlingFee;

  // 2. Labor
  let laborItems = [];
  let totalLaborHours = 0;
  let totalLaborCost = 0;

  if (Array.isArray(params.labor) && params.labor.length > 0) {
    laborItems = params.labor.map(item => {
      const h = Number(item.hours || 0);
      const r = Number(item.hourlyCost || item.rate || 0);
      if (h < 0 || r < 0) throw new Error('Labor hours and rates cannot be negative');
      const cost = h * r;
      totalLaborHours += h;
      totalLaborCost += cost;
      return {
        role: item.role || 'Craftsman',
        hours: round(h, 2),
        hourlyCost: round(r, 2),
        totalCost: round(cost, 2)
      };
    });
  } else {
    const flatHours = Number(params.laborHours ?? 0);
    const flatRate = Number(params.laborHourlyRate ?? params.laborCostPerHour ?? 0);
    if (flatHours < 0 || flatRate < 0) throw new Error('Labor hours and rate cannot be negative');
    totalLaborHours = flatHours;
    totalLaborCost = flatHours * flatRate;
    if (flatHours > 0) {
      laborItems.push({
        role: 'Direct Labor',
        hours: round(flatHours, 2),
        hourlyCost: round(flatRate, 2),
        totalCost: round(totalLaborCost, 2)
      });
    }
  }

  // 3. Subcontractors
  let subItems = [];
  let totalSubcontractorCost = 0;

  if (Array.isArray(params.subcontractors) && params.subcontractors.length > 0) {
    subItems = params.subcontractors.map(sub => {
      const c = Number(sub.cost || 0);
      const m = Number(sub.markupRate || 0);
      if (c < 0 || m < 0) throw new Error('Subcontractor costs cannot be negative');
      const markedUp = c * (1 + m);
      totalSubcontractorCost += c;
      return {
        trade: sub.trade || 'Subcontractor',
        cost: round(c, 2),
        markupRate: round(m, 4),
        markedUpCost: round(markedUp, 2)
      };
    });
  } else {
    const flatSubCost = Number(params.subcontractorCost ?? 0);
    if (flatSubCost < 0) throw new Error('subcontractorCost cannot be negative');
    totalSubcontractorCost = flatSubCost;
    if (flatSubCost > 0) {
      subItems.push({
        trade: 'Subcontractors Total',
        cost: round(flatSubCost, 2),
        markupRate: 0,
        markedUpCost: round(flatSubCost, 2)
      });
    }
  }

  // 4. Equipment, permits, site logistics
  const equipmentAndPermitsCost = Number(params.equipmentAndPermitsCost ?? 0);
  if (equipmentAndPermitsCost < 0) throw new Error('equipmentAndPermitsCost cannot be negative');

  // Direct Job Costs Subtotal
  const baseDirectCosts = totalDirectMaterialsCost + totalLaborCost + totalSubcontractorCost + equipmentAndPermitsCost;

  // 5. Jobsite Contingency
  const contingencyRate = Number(params.contingencyRate ?? 0);
  if (contingencyRate < 0) throw new Error('contingencyRate cannot be negative');
  const contingencyAmount = baseDirectCosts * contingencyRate;
  const totalDirectCosts = baseDirectCosts + contingencyAmount;

  // 6. Overhead and Target Profit Margin
  const overheadRate = Number(params.overheadRate ?? 0.15);
  const overheadMethod = params.overheadMethod === 'percentOfRevenue' ? 'percentOfRevenue' : 'percentOfDirectCosts';
  const targetNetMarginRate = Number(params.targetNetMarginRate ?? 0.20);

  if (targetNetMarginRate < 0 || targetNetMarginRate >= 1) {
    throw new Error('targetNetMarginRate must be >= 0 and strictly less than 1.0 (100%)');
  }

  let allocatedOverheadCost = 0;
  let fullyBurdenedCost = 0;
  let targetSellingPrice = 0;
  let breakEvenPrice = 0;

  if (overheadMethod === 'percentOfDirectCosts') {
    allocatedOverheadCost = totalDirectCosts * overheadRate;
    fullyBurdenedCost = totalDirectCosts + allocatedOverheadCost;
    breakEvenPrice = fullyBurdenedCost;
    // Price = Cost / (1 - NetMargin)
    targetSellingPrice = fullyBurdenedCost / (1 - targetNetMarginRate);
  } else {
    // Both overhead and net profit are fractions of selling price:
    // Price = DirectCosts / (1 - overheadRate - targetNetMarginRate)
    const combinedDeduction = overheadRate + targetNetMarginRate;
    if (combinedDeduction >= 1) {
      throw new Error('Combined overhead and profit margin on revenue must be strictly less than 1.0 (100%)');
    }
    targetSellingPrice = totalDirectCosts / (1 - combinedDeduction);
    allocatedOverheadCost = targetSellingPrice * overheadRate;
    fullyBurdenedCost = totalDirectCosts + allocatedOverheadCost;
    breakEvenPrice = totalDirectCosts / (1 - overheadRate);
  }

  // 7. Profit & Return Metrics
  const targetNetProfit = targetSellingPrice - fullyBurdenedCost;
  const actualNetMargin = targetSellingPrice > 0 ? (targetNetProfit / targetSellingPrice) : 0;
  const grossProfit = targetSellingPrice - totalDirectCosts;
  const grossMargin = targetSellingPrice > 0 ? (grossProfit / targetSellingPrice) : 0;

  // Markup equivalents (Cost to Price multiplier)
  const markupOnDirectCosts = totalDirectCosts > 0 ? (targetSellingPrice - totalDirectCosts) / totalDirectCosts : 0;
  const markupOnTotalCost = fullyBurdenedCost > 0 ? (targetSellingPrice - fullyBurdenedCost) / fullyBurdenedCost : 0;

  // 8. Overrun & Slippage Sensitivity (What happens if things go wrong on the job?)
  const sensitivity = calculateSensitivity({
    baseSellingPrice: targetSellingPrice,
    baseFullyBurdenedCost: fullyBurdenedCost,
    totalLaborCost,
    totalDirectMaterialsCost,
    totalDirectCosts,
    allocatedOverheadCost
  });

  return {
    jobName,
    summary: {
      directCosts: round(totalDirectCosts, 2),
      allocatedOverhead: round(allocatedOverheadCost, 2),
      fullyBurdenedCost: round(fullyBurdenedCost, 2),
      breakEvenPrice: round(breakEvenPrice, 2),
      targetSellingPrice: round(targetSellingPrice, 2),
      targetNetProfit: round(targetNetProfit, 2),
      targetGrossProfit: round(grossProfit, 2),
      targetNetMarginPercent: round(actualNetMargin * 100, 2),
      targetGrossMarginPercent: round(grossMargin * 100, 2),
      requiredMarkupOnDirectCostsPercent: round(markupOnDirectCosts * 100, 2),
      requiredMarkupOnTotalCostPercent: round(markupOnTotalCost * 100, 2)
    },
    costBreakdown: {
      materials: {
        rawMaterials: round(rawMaterials, 2),
        wasteRatePercent: round(wasteRate * 100, 2),
        wasteAmount: round(materialsWasteAmount, 2),
        handlingRatePercent: round(handlingRate * 100, 2),
        handlingFee: round(materialsHandlingFee, 2),
        totalDirectMaterialsCost: round(totalDirectMaterialsCost, 2)
      },
      labor: {
        totalHours: round(totalLaborHours, 2),
        totalLaborCost: round(totalLaborCost, 2),
        items: laborItems
      },
      subcontractors: {
        totalSubcontractorCost: round(totalSubcontractorCost, 2),
        items: subItems
      },
      equipmentAndPermitsCost: round(equipmentAndPermitsCost, 2),
      contingency: {
        ratePercent: round(contingencyRate * 100, 2),
        amount: round(contingencyAmount, 2)
      },
      overhead: {
        method: overheadMethod,
        ratePercent: round(overheadRate * 100, 2),
        allocatedAmount: round(allocatedOverheadCost, 2)
      }
    },
    marginVsMarkupExplanation: {
      rule: 'Margin is calculated on Selling Price ($ / Revenue), while Markup is added on Cost ($ / Cost).',
      targetMarginGoal: `${round(targetNetMarginRate * 100, 2)}%`,
      equivalentMarkupOnTotalCost: `${round(markupOnTotalCost * 100, 2)}%`,
      warning: markupOnTotalCost > targetNetMarginRate 
        ? `To net ${round(targetNetMarginRate * 100, 1)}% profit margin, you must mark up your total costs by ${round(markupOnTotalCost * 100, 1)}%. If you only mark up by ${round(targetNetMarginRate * 100, 1)}%, your real profit margin will only be ${round((targetNetMarginRate / (1 + targetNetMarginRate)) * 100, 1)}%!`
        : null
    },
    sensitivity
  };
}

/**
 * Calculates the impact of labor and material overruns on profit and margins.
 */
function calculateSensitivity({ baseSellingPrice, baseFullyBurdenedCost, totalLaborCost, totalDirectMaterialsCost, totalDirectCosts, allocatedOverheadCost }) {
  const scenarios = [
    { label: 'On Schedule / Exact Plan', laborMultiplier: 1.0, materialMultiplier: 1.0 },
    { label: 'Labor +10% Overrun (Rain/Delays)', laborMultiplier: 1.10, materialMultiplier: 1.0 },
    { label: 'Labor +20% Overrun (Crew Slippage)', laborMultiplier: 1.20, materialMultiplier: 1.0 },
    { label: 'Materials +10% Price Spike', laborMultiplier: 1.0, materialMultiplier: 1.10 },
    { label: 'Worst Case: +20% Labor & +10% Materials', laborMultiplier: 1.20, materialMultiplier: 1.10 }
  ];

  return scenarios.map(sc => {
    const extraLabor = totalLaborCost * (sc.laborMultiplier - 1.0);
    const extraMaterial = totalDirectMaterialsCost * (sc.materialMultiplier - 1.0);
    const revisedDirectCost = totalDirectCosts + extraLabor + extraMaterial;
    const revisedTotalCost = revisedDirectCost + allocatedOverheadCost;
    const revisedNetProfit = baseSellingPrice - revisedTotalCost;
    const revisedNetMargin = baseSellingPrice > 0 ? (revisedNetProfit / baseSellingPrice) : 0;

    return {
      scenario: sc.label,
      revisedTotalCost: round(revisedTotalCost, 2),
      revisedNetProfit: round(revisedNetProfit, 2),
      revisedNetMarginPercent: round(revisedNetMargin * 100, 2),
      profitErosionVsPlan: round((baseSellingPrice - baseFullyBurdenedCost) - revisedNetProfit, 2)
    };
  });
}

function round(val, decimals = 2) {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Format calculation result to console ASCII table
 */
function formatConsoleTable(result) {
  const s = result.summary;
  const b = result.costBreakdown;
  const lines = [
    '========================================================================',
    `              CONTRACTOR JOB PRICING & BID REPORT                       `,
    ` Project Name: ${result.jobName.padEnd(56)}`,
    '========================================================================',
    ' DIRECT JOB COSTS BREAKDOWN',
    '------------------------------------------------------------------------',
    ` 1. Materials (Raw + Waste/Fee) : $${b.materials.totalDirectMaterialsCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ` 2. Direct Labor (${b.labor.totalHours} hrs)         : $${b.labor.totalLaborCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ` 3. Subcontractors              : $${b.subcontractors.totalSubcontractorCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ` 4. Equipment, Rentals & Permits: $${b.equipmentAndPermitsCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ` 5. Contingency Buffer (${b.contingency.ratePercent}%)     : $${b.contingency.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    '------------------------------------------------------------------------',
    ` TOTAL DIRECT JOB COSTS         : $${s.directCosts.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ` Allocated Company Overhead (${b.overhead.ratePercent}%): $${s.allocatedOverhead.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    '------------------------------------------------------------------------',
    ` FULLY BURDENED JOB COST (ALL-IN): $${s.fullyBurdenedCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    '========================================================================',
    ' FINAL PRICING & PROFIT ENGINE',
    '========================================================================',
    ` >>> BREAK-EVEN BID PRICE (0% Net): $${s.breakEvenPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} <<<`,
    ` >>> TARGET SELLING PRICE BID    : $${s.targetSellingPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })} <<<`,
    '------------------------------------------------------------------------',
    ` Target Gross Profit ($)        : $${s.targetGrossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${s.targetGrossMarginPercent}% Gross Margin)`,
    ` Target Net Profit In Pocket ($): $${s.targetNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${s.targetNetMarginPercent}% Net Margin)`,
    ` Required Markup on Total Cost  : ${s.requiredMarkupOnTotalCostPercent}% (To secure ${s.targetNetMarginPercent}% net margin)`,
    ` Required Markup on Direct Costs: ${s.requiredMarkupOnDirectCostsPercent}%`,
    '========================================================================',
    ' OVERRUN RISK & SLIPPAGE SENSITIVITY TABLE',
    '========================================================================'
  ];

  for (const sc of result.sensitivity) {
    const profitSign = sc.revisedNetProfit >= 0 ? '$' : '-$';
    const absProfit = Math.abs(sc.revisedNetProfit).toLocaleString('en-US', { minimumFractionDigits: 2 });
    lines.push(` ${sc.scenario.padEnd(42)}: Profit ${profitSign}${absProfit} (${sc.revisedNetMarginPercent}%)`);
  }
  lines.push('========================================================================');
  return lines.join('\n');
}

/**
 * Format calculation result to CSV string
 */
function formatCSV(result) {
  const rows = [
    ['Category', 'Parameter / Metric', 'Value', 'Unit'],
    ['Header', 'Project Name', result.jobName, 'Text'],
    ['Direct Cost', 'Total Materials Cost', result.costBreakdown.materials.totalDirectMaterialsCost, 'USD'],
    ['Direct Cost', 'Total Labor Hours', result.costBreakdown.labor.totalHours, 'Hours'],
    ['Direct Cost', 'Total Labor Cost', result.costBreakdown.labor.totalLaborCost, 'USD'],
    ['Direct Cost', 'Subcontractors Cost', result.costBreakdown.subcontractors.totalSubcontractorCost, 'USD'],
    ['Direct Cost', 'Equipment and Permits', result.costBreakdown.equipmentAndPermitsCost, 'USD'],
    ['Direct Cost', 'Contingency Buffer', result.costBreakdown.contingency.amount, 'USD'],
    ['Direct Cost', 'Total Direct Costs', result.summary.directCosts, 'USD'],
    ['Overhead', 'Allocated Overhead Cost', result.summary.allocatedOverhead, 'USD'],
    ['Total Cost', 'Fully Burdened Cost', result.summary.fullyBurdenedCost, 'USD'],
    ['Pricing', 'Break-Even Selling Price', result.summary.breakEvenPrice, 'USD'],
    ['Pricing', 'Target Selling Price', result.summary.targetSellingPrice, 'USD'],
    ['Profit', 'Target Gross Profit', result.summary.targetGrossProfit, 'USD'],
    ['Profit', 'Target Gross Margin Percent', result.summary.targetGrossMarginPercent, 'Percent'],
    ['Profit', 'Target Net Profit', result.summary.targetNetProfit, 'USD'],
    ['Profit', 'Target Net Margin Percent', result.summary.targetNetMarginPercent, 'Percent'],
    ['Markup', 'Required Markup On Total Cost', result.summary.requiredMarkupOnTotalCostPercent, 'Percent'],
    ['Markup', 'Required Markup On Direct Costs', result.summary.requiredMarkupOnDirectCostsPercent, 'Percent']
  ];

  for (const sc of result.sensitivity) {
    rows.push(['Sensitivity', sc.scenario, sc.revisedNetProfit, `USD (${sc.revisedNetMarginPercent}% margin)`]);
  }

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

  const name = parsed.name || 'Commercial HVAC Project';
  const materials = parsed.materials || parsed.m || 15000;
  const hours = parsed.hours || parsed.h || 120;
  const rate = parsed.rate || parsed.r || 48; // true burdened hourly cost
  const subs = parsed.subs || parsed.s || 6500;
  const equipment = parsed.equipment || parsed.e || 1200;
  const overhead = parsed.overhead || parsed.o || 0.15;
  const margin = parsed.margin || 0.20;

  const res = calculateJobPrice({
    jobName: name,
    materialsCost: parseFloat(materials),
    laborHours: parseFloat(hours),
    laborHourlyRate: parseFloat(rate),
    subcontractorCost: parseFloat(subs),
    equipmentAndPermitsCost: parseFloat(equipment),
    overheadRate: parseFloat(overhead),
    targetNetMarginRate: parseFloat(margin)
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
  calculateJobPrice,
  formatConsoleTable,
  formatCSV,
  formatJSON
};
