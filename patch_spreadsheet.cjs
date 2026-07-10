const fs = require('fs');
let code = fs.readFileSync('src/services/spreadsheetService.ts', 'utf8');

// Replace the Promise.allSettled array
code = code.replace(
  /const \[\s*pegawaiResult,\s*vehiclesResult,\s*equipmentResult,\s*inventoryResult,\s*loansResult,\s*maintenanceResult,\s*budgetsResult,\s*forecastResult,?\s*\] = await Promise\.allSettled\(\[\s*this\.getPegawai\(\),\s*this\.getVehicles\(\),\s*this\.getEquipment\(\),\s*this\.getInventory\(\),\s*this\.getLoans\(\),\s*this\.getMaintenance\(\),\s*this\.getBudgets\(\),\s*this\.getMaintenanceForecast\(\),\s*\]\);/,
  `const [
      pegawaiResult,
      vehiclesResult,
      equipmentResult,
      loansResult
    ] = await Promise.allSettled([
      this.getPegawai(),
      this.getVehicles(),
      this.getEquipment(),
      this.getLoans(),
    ]);
    const inventoryResult = { status: "fulfilled", value: [] } as PromiseSettledResult<any[]>;
    const maintenanceResult = { status: "fulfilled", value: [] } as PromiseSettledResult<any[]>;
    const budgetsResult = { status: "fulfilled", value: [] } as PromiseSettledResult<any[]>;
    const forecastResult = { status: "fulfilled", value: { avgMonthlyCost: 0, sixMonthTotal: 0, forecastData: [] } } as PromiseSettledResult<any>;`
);

fs.writeFileSync('src/services/spreadsheetService.ts', code);
