import { PrismaClient } from '../src/prisma/generated';

const prisma = new PrismaClient();

// Use the same demo company ID from CRM seed
const DEMO_COMPANY_ID = process.env.SEED_COMPANY_ID ?? 'co-demo-001';

async function main() {
  console.log('Seeding job-service database...');

  // ---- Job Types ----
  const hvac = await prisma.jobType.upsert({
    where: { companyId_slug: { companyId: DEMO_COMPANY_ID, slug: 'hvac' } },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      name: 'HVAC',
      slug: 'hvac',
      description: 'Heating, Ventilation & Air Conditioning',
      icon: 'wind',
      color: '#3B82F6',
      sortOrder: 1,
    },
  });

  const plumbing = await prisma.jobType.upsert({
    where: { companyId_slug: { companyId: DEMO_COMPANY_ID, slug: 'plumbing' } },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      name: 'Plumbing',
      slug: 'plumbing',
      description: 'Water supply, drainage and gas piping',
      icon: 'droplets',
      color: '#06B6D4',
      sortOrder: 2,
    },
  });

  const electrical = await prisma.jobType.upsert({
    where: { companyId_slug: { companyId: DEMO_COMPANY_ID, slug: 'electrical' } },
    update: {},
    create: {
      companyId: DEMO_COMPANY_ID,
      name: 'Electrical',
      slug: 'electrical',
      description: 'Wiring, panels, outlets and lighting',
      icon: 'zap',
      color: '#F59E0B',
      sortOrder: 3,
    },
  });

  console.log('✓ Job types: HVAC, Plumbing, Electrical');

  // ---- HVAC Templates ----
  const hvacMaintenance = await prisma.jobTemplate.upsert({
    where: { id: 'tmpl-hvac-annual-maintenance' },
    update: {},
    create: {
      id: 'tmpl-hvac-annual-maintenance',
      companyId: DEMO_COMPANY_ID,
      jobTypeId: hvac.id,
      name: 'Annual AC Tune-Up & Maintenance',
      description: 'Full seasonal inspection and tune-up for split/package AC units',
      estimatedDurationMins: 90,
      tasks: {
        create: [
          { taskOrder: 1, taskName: 'Inspect and clean air filters', isRequired: true, photoRequired: false },
          { taskOrder: 2, taskName: 'Check refrigerant pressure and levels', isRequired: true, photoRequired: true, safetyNote: 'Wear gloves and eye protection when handling refrigerant' },
          { taskOrder: 3, taskName: 'Inspect evaporator and condenser coils', isRequired: true, photoRequired: true },
          { taskOrder: 4, taskName: 'Clean condenser coils', isRequired: true, photoRequired: false },
          { taskOrder: 5, taskName: 'Check and tighten electrical connections', isRequired: true, photoRequired: false, safetyNote: 'Disconnect power before accessing electrical components' },
          { taskOrder: 6, taskName: 'Inspect capacitors and contactors', isRequired: true, photoRequired: true },
          { taskOrder: 7, taskName: 'Measure and record supply/return air temperatures', isRequired: true, photoRequired: false },
          { taskOrder: 8, taskName: 'Lubricate fan motor bearings', isRequired: false, photoRequired: false },
          { taskOrder: 9, taskName: 'Inspect condensate drain line and flush', isRequired: true, photoRequired: false },
          { taskOrder: 10, taskName: 'Test thermostat calibration', isRequired: true, photoRequired: false },
          { taskOrder: 11, taskName: 'Document all readings and findings', isRequired: true, photoRequired: false },
        ],
      },
    },
  });

  await prisma.jobTemplate.upsert({
    where: { id: 'tmpl-hvac-ac-install' },
    update: {},
    create: {
      id: 'tmpl-hvac-ac-install',
      companyId: DEMO_COMPANY_ID,
      jobTypeId: hvac.id,
      name: 'New AC Unit Installation',
      description: 'Full installation of split AC system including outdoor and indoor units',
      estimatedDurationMins: 300,
      tasks: {
        create: [
          { taskOrder: 1, taskName: 'Verify equipment model and serial against work order', isRequired: true, photoRequired: true },
          { taskOrder: 2, taskName: 'Prepare installation site (outdoor pad/bracket)', isRequired: true, photoRequired: true },
          { taskOrder: 3, taskName: 'Install outdoor condenser unit and secure', isRequired: true, photoRequired: true },
          { taskOrder: 4, taskName: 'Install indoor air handler / evaporator', isRequired: true, photoRequired: true },
          { taskOrder: 5, taskName: 'Run refrigerant line set and insulate', isRequired: true, photoRequired: true, safetyNote: 'Pressure test lines before charging' },
          { taskOrder: 6, taskName: 'Connect electrical wiring (high and low voltage)', isRequired: true, photoRequired: false, safetyNote: 'Ensure main breaker is OFF before wiring' },
          { taskOrder: 7, taskName: 'Evacuate and charge refrigerant to manufacturer spec', isRequired: true, photoRequired: true, safetyNote: 'Record refrigerant weight added on work order' },
          { taskOrder: 8, taskName: 'Install and program thermostat', isRequired: true, photoRequired: false },
          { taskOrder: 9, taskName: 'System startup and operational check', isRequired: true, photoRequired: false },
          { taskOrder: 10, taskName: 'Walk customer through thermostat and filter maintenance', isRequired: true, photoRequired: false },
          { taskOrder: 11, taskName: 'Customer signature and equipment registration', isRequired: true, photoRequired: false },
        ],
      },
    },
  });

  // ---- Plumbing Templates ----
  await prisma.jobTemplate.upsert({
    where: { id: 'tmpl-plumbing-leak-repair' },
    update: {},
    create: {
      id: 'tmpl-plumbing-leak-repair',
      companyId: DEMO_COMPANY_ID,
      jobTypeId: plumbing.id,
      name: 'Leak Detection & Repair',
      description: 'Locate and repair water supply or drain leak',
      estimatedDurationMins: 120,
      tasks: {
        create: [
          { taskOrder: 1, taskName: 'Photograph leak area before work begins', isRequired: true, photoRequired: true },
          { taskOrder: 2, taskName: 'Shut off water supply and confirm no pressure', isRequired: true, photoRequired: false, safetyNote: 'Confirm water meter reads zero before cutting any pipe' },
          { taskOrder: 3, taskName: 'Locate and expose leak point', isRequired: true, photoRequired: true },
          { taskOrder: 4, taskName: 'Document pipe material and size', isRequired: true, photoRequired: false },
          { taskOrder: 5, taskName: 'Complete repair (patch/section replace/fitting)', isRequired: true, photoRequired: true },
          { taskOrder: 6, taskName: 'Restore water supply and pressure test for 10 minutes', isRequired: true, photoRequired: false },
          { taskOrder: 7, taskName: 'Photograph completed repair', isRequired: true, photoRequired: true },
          { taskOrder: 8, taskName: 'Check adjacent areas for secondary moisture damage', isRequired: false, photoRequired: false },
        ],
      },
    },
  });

  await prisma.jobTemplate.upsert({
    where: { id: 'tmpl-plumbing-wh-install' },
    update: {},
    create: {
      id: 'tmpl-plumbing-wh-install',
      companyId: DEMO_COMPANY_ID,
      jobTypeId: plumbing.id,
      name: 'Water Heater Replacement',
      description: 'Remove old water heater and install replacement',
      estimatedDurationMins: 180,
      tasks: {
        create: [
          { taskOrder: 1, taskName: 'Confirm new unit specs match old (size, BTU, fuel type)', isRequired: true, photoRequired: false },
          { taskOrder: 2, taskName: 'Turn off gas/electric supply and cold water inlet', isRequired: true, photoRequired: false, safetyNote: 'For gas units: check for gas odour before proceeding' },
          { taskOrder: 3, taskName: 'Drain old water heater via drain valve', isRequired: true, photoRequired: false },
          { taskOrder: 4, taskName: 'Disconnect supply, return lines and gas/electric', isRequired: true, photoRequired: false },
          { taskOrder: 5, taskName: 'Remove old unit and photograph data plate', isRequired: true, photoRequired: true },
          { taskOrder: 6, taskName: 'Install new unit — level and secure to wall straps', isRequired: true, photoRequired: true },
          { taskOrder: 7, taskName: 'Connect cold/hot lines and T&P relief valve', isRequired: true, photoRequired: false },
          { taskOrder: 8, taskName: 'Connect gas line and test for leaks with detector', isRequired: true, photoRequired: false, safetyNote: 'Use gas leak detector — never use open flame' },
          { taskOrder: 9, taskName: 'Light pilot / energise and verify ignition', isRequired: true, photoRequired: false },
          { taskOrder: 10, taskName: 'Set thermostat to 120°F (49°C)', isRequired: true, photoRequired: false },
          { taskOrder: 11, taskName: 'Check all connections for leaks after 30 minutes', isRequired: true, photoRequired: false },
        ],
      },
    },
  });

  // ---- Electrical Templates ----
  await prisma.jobTemplate.upsert({
    where: { id: 'tmpl-electrical-panel-upgrade' },
    update: {},
    create: {
      id: 'tmpl-electrical-panel-upgrade',
      companyId: DEMO_COMPANY_ID,
      jobTypeId: electrical.id,
      name: 'Electrical Panel Upgrade',
      description: 'Replace outdated panel or upgrade amperage service',
      estimatedDurationMins: 360,
      tasks: {
        create: [
          { taskOrder: 1, taskName: 'Notify utility company and confirm service disconnect schedule', isRequired: true, photoRequired: false, safetyNote: 'Do NOT begin work until utility has disconnected service at the meter' },
          { taskOrder: 2, taskName: 'Photograph existing panel — wiring layout and labelling', isRequired: true, photoRequired: true },
          { taskOrder: 3, taskName: 'Document all existing circuits and breaker sizes', isRequired: true, photoRequired: false },
          { taskOrder: 4, taskName: 'Remove old panel carefully, label all conductors', isRequired: true, photoRequired: false },
          { taskOrder: 5, taskName: 'Install new panel and secure to wall', isRequired: true, photoRequired: true },
          { taskOrder: 6, taskName: 'Install main breaker and neutral/ground bars', isRequired: true, photoRequired: false },
          { taskOrder: 7, taskName: 'Transfer and connect branch circuit wiring', isRequired: true, photoRequired: false, safetyNote: 'Confirm each circuit conductor is correct gauge for breaker amperage' },
          { taskOrder: 8, taskName: 'Bond neutral and ground at main panel only', isRequired: true, photoRequired: false },
          { taskOrder: 9, taskName: 'Have utility reconnect service', isRequired: true, photoRequired: false },
          { taskOrder: 10, taskName: 'Energise panel and test all circuits', isRequired: true, photoRequired: false },
          { taskOrder: 11, taskName: 'Label all breakers clearly', isRequired: true, photoRequired: true },
          { taskOrder: 12, taskName: 'Schedule inspection with AHJ (Authority Having Jurisdiction)', isRequired: true, photoRequired: false },
        ],
      },
    },
  });

  await prisma.jobTemplate.upsert({
    where: { id: 'tmpl-electrical-outlet-install' },
    update: {},
    create: {
      id: 'tmpl-electrical-outlet-install',
      companyId: DEMO_COMPANY_ID,
      jobTypeId: electrical.id,
      name: 'Outlet / Switch Installation',
      description: 'Install new or replace existing outlet or switch',
      estimatedDurationMins: 60,
      tasks: {
        create: [
          { taskOrder: 1, taskName: 'Turn off circuit breaker and verify with tester', isRequired: true, photoRequired: false, safetyNote: 'Always verify zero voltage with non-contact tester before touching wires' },
          { taskOrder: 2, taskName: 'Remove existing device and inspect wiring condition', isRequired: true, photoRequired: true },
          { taskOrder: 3, taskName: 'Install new device and connect conductors correctly (L/N/G)', isRequired: true, photoRequired: false },
          { taskOrder: 4, taskName: 'Restore power and test with outlet tester or switch', isRequired: true, photoRequired: false },
          { taskOrder: 5, taskName: 'Install cover plate', isRequired: true, photoRequired: true },
        ],
      },
    },
  });

  console.log('✓ Job templates seeded (5 templates across 3 trades)');

  // ---- HVAC Custom Field Definitions ----
  const hvacFields = [
    { fieldKey: 'refrigerant_type', label: 'Refrigerant Type', fieldType: 'SELECT' as const, options: ['R-410A', 'R-22', 'R-32', 'R-407C', 'R-454B'], isRequired: true, sortOrder: 1 },
    { fieldKey: 'system_tonnage', label: 'System Tonnage', fieldType: 'NUMBER' as const, helpText: 'e.g. 2.5, 3, 4 tons', isRequired: true, sortOrder: 2 },
    { fieldKey: 'seer_rating', label: 'SEER Rating', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 3 },
    { fieldKey: 'filter_size', label: 'Filter Size', fieldType: 'TEXT' as const, helpText: 'e.g. 16x25x1', isRequired: false, sortOrder: 4 },
    { fieldKey: 'refrigerant_added_oz', label: 'Refrigerant Added (oz)', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 5 },
    { fieldKey: 'suction_pressure_psi', label: 'Suction Pressure (PSI)', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 6 },
    { fieldKey: 'discharge_pressure_psi', label: 'Discharge Pressure (PSI)', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 7 },
    { fieldKey: 'supply_air_temp_f', label: 'Supply Air Temp (°F)', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 8 },
    { fieldKey: 'return_air_temp_f', label: 'Return Air Temp (°F)', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 9 },
    { fieldKey: 'equipment_make', label: 'Equipment Make', fieldType: 'TEXT' as const, isRequired: false, sortOrder: 10 },
    { fieldKey: 'equipment_model', label: 'Equipment Model', fieldType: 'TEXT' as const, isRequired: false, sortOrder: 11 },
    { fieldKey: 'equipment_serial', label: 'Equipment Serial #', fieldType: 'TEXT' as const, isRequired: false, sortOrder: 12 },
    { fieldKey: 'under_warranty', label: 'Under Warranty?', fieldType: 'BOOLEAN' as const, isRequired: false, sortOrder: 13 },
  ];

  for (const field of hvacFields) {
    await prisma.jobCustomFieldDef.upsert({
      where: { jobTypeId_fieldKey: { jobTypeId: hvac.id, fieldKey: field.fieldKey } },
      update: {},
      create: { companyId: DEMO_COMPANY_ID, jobTypeId: hvac.id, ...field, options: field.options ?? undefined },
    });
  }

  // ---- Plumbing Custom Field Definitions ----
  const plumbingFields = [
    { fieldKey: 'pipe_material', label: 'Pipe Material', fieldType: 'SELECT' as const, options: ['Copper', 'PVC', 'CPVC', 'PEX', 'Galvanised', 'Cast Iron', 'ABS'], isRequired: false, sortOrder: 1 },
    { fieldKey: 'pipe_diameter_in', label: 'Pipe Diameter (inches)', fieldType: 'SELECT' as const, options: ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '3"', '4"'], isRequired: false, sortOrder: 2 },
    { fieldKey: 'water_pressure_psi', label: 'Water Pressure (PSI)', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 3 },
    { fieldKey: 'water_heater_size_gal', label: 'Water Heater Size (gal)', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 4 },
    { fieldKey: 'fuel_type', label: 'Fuel Type', fieldType: 'SELECT' as const, options: ['Natural Gas', 'Propane', 'Electric', 'Solar'], isRequired: false, sortOrder: 5 },
    { fieldKey: 'shut_off_location', label: 'Main Shut-off Location', fieldType: 'TEXT' as const, isRequired: false, sortOrder: 6 },
    { fieldKey: 'leak_type', label: 'Leak Type', fieldType: 'SELECT' as const, options: ['Supply', 'Drain', 'Gas', 'Roof'], isRequired: false, sortOrder: 7 },
    { fieldKey: 'permit_required', label: 'Permit Required?', fieldType: 'BOOLEAN' as const, isRequired: false, sortOrder: 8 },
    { fieldKey: 'permit_number', label: 'Permit Number', fieldType: 'TEXT' as const, isRequired: false, sortOrder: 9 },
  ];

  for (const field of plumbingFields) {
    await prisma.jobCustomFieldDef.upsert({
      where: { jobTypeId_fieldKey: { jobTypeId: plumbing.id, fieldKey: field.fieldKey } },
      update: {},
      create: { companyId: DEMO_COMPANY_ID, jobTypeId: plumbing.id, ...field, options: field.options ?? undefined },
    });
  }

  // ---- Electrical Custom Field Definitions ----
  const electricalFields = [
    { fieldKey: 'panel_amperage', label: 'Panel Amperage', fieldType: 'SELECT' as const, options: ['60A', '100A', '150A', '200A', '400A'], isRequired: false, sortOrder: 1 },
    { fieldKey: 'voltage', label: 'Voltage', fieldType: 'SELECT' as const, options: ['120V', '240V', '208V', '277V', '480V'], isRequired: false, sortOrder: 2 },
    { fieldKey: 'circuit_count', label: 'Number of Circuits', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 3 },
    { fieldKey: 'wire_gauge', label: 'Wire Gauge (AWG)', fieldType: 'SELECT' as const, options: ['14 AWG', '12 AWG', '10 AWG', '8 AWG', '6 AWG', '4 AWG', '2 AWG', '1/0 AWG', '2/0 AWG'], isRequired: false, sortOrder: 4 },
    { fieldKey: 'gfci_required', label: 'GFCI Required?', fieldType: 'BOOLEAN' as const, isRequired: false, sortOrder: 5 },
    { fieldKey: 'afci_required', label: 'AFCI Required?', fieldType: 'BOOLEAN' as const, isRequired: false, sortOrder: 6 },
    { fieldKey: 'panel_brand', label: 'Panel Brand', fieldType: 'SELECT' as const, options: ['Square D', 'Siemens', 'Eaton', 'Leviton', 'Cutler-Hammer', 'GE', 'Other'], isRequired: false, sortOrder: 7 },
    { fieldKey: 'inspection_required', label: 'Inspection Required?', fieldType: 'BOOLEAN' as const, isRequired: false, sortOrder: 8 },
    { fieldKey: 'permit_number', label: 'Permit Number', fieldType: 'TEXT' as const, isRequired: false, sortOrder: 9 },
  ];

  for (const field of electricalFields) {
    await prisma.jobCustomFieldDef.upsert({
      where: { jobTypeId_fieldKey: { jobTypeId: electrical.id, fieldKey: field.fieldKey } },
      update: {},
      create: { companyId: DEMO_COMPANY_ID, jobTypeId: electrical.id, ...field, options: field.options ?? undefined },
    });
  }

  console.log('✓ Custom field definitions seeded (HVAC: 13, Plumbing: 9, Electrical: 9)');

  // ---- Price Book — common items ----
  const priceBookItems = [
    // Labour
    { category: 'LABOUR' as const, code: 'LAB-STD', name: 'Standard Labour', unit: 'hour', unitPrice: 95.00 },
    { category: 'LABOUR' as const, code: 'LAB-OT', name: 'Overtime Labour', unit: 'hour', unitPrice: 142.50 },
    { category: 'LABOUR' as const, code: 'LAB-EMERGENCY', name: 'Emergency Call-Out Labour', unit: 'hour', unitPrice: 190.00 },
    // HVAC Parts
    { category: 'PART' as const, code: 'HVAC-FILTER-1', name: 'Air Filter 16x25x1', unit: 'each', unitPrice: 12.00, jobTypeId: undefined },
    { category: 'PART' as const, code: 'HVAC-FILTER-2', name: 'Air Filter 20x25x4 MERV11', unit: 'each', unitPrice: 35.00 },
    { category: 'PART' as const, code: 'HVAC-CAP-RUN', name: 'Run Capacitor (35/5 MFD)', unit: 'each', unitPrice: 45.00 },
    { category: 'PART' as const, code: 'HVAC-CONTACTOR', name: 'Contactor 40A', unit: 'each', unitPrice: 55.00 },
    { category: 'PART' as const, code: 'HVAC-REFRIGERANT-LB', name: 'R-410A Refrigerant', unit: 'lb', unitPrice: 85.00 },
    { category: 'PART' as const, code: 'HVAC-DRAIN-PAN-TAB', name: 'Condensate Pan Treatment Tablets', unit: 'pack', unitPrice: 15.00 },
    // Plumbing Parts
    { category: 'PART' as const, code: 'PLMB-SHUTOFF-1/2', name: 'Ball Valve Shut-off 1/2"', unit: 'each', unitPrice: 18.00 },
    { category: 'PART' as const, code: 'PLMB-SHUTOFF-3/4', name: 'Ball Valve Shut-off 3/4"', unit: 'each', unitPrice: 24.00 },
    { category: 'PART' as const, code: 'PLMB-WH-ANODE', name: 'Water Heater Anode Rod', unit: 'each', unitPrice: 32.00 },
    { category: 'PART' as const, code: 'PLMB-TPR-VALVE', name: 'T&P Relief Valve 3/4"', unit: 'each', unitPrice: 28.00 },
    // Electrical Parts
    { category: 'PART' as const, code: 'ELEC-BREAKER-20A', name: 'Circuit Breaker 20A', unit: 'each', unitPrice: 22.00 },
    { category: 'PART' as const, code: 'ELEC-BREAKER-30A', name: 'Circuit Breaker 30A', unit: 'each', unitPrice: 28.00 },
    { category: 'PART' as const, code: 'ELEC-OUTLET-GFCI', name: 'GFCI Outlet 20A', unit: 'each', unitPrice: 18.00 },
    { category: 'PART' as const, code: 'ELEC-WIRE-12-25', name: '12 AWG Wire (25ft)', unit: 'roll', unitPrice: 45.00 },
  ];

  for (const item of priceBookItems) {
    await prisma.priceBookItem.upsert({
      where: { id: `pb-${item.code}` },
      update: {},
      create: { id: `pb-${item.code}`, companyId: DEMO_COMPANY_ID, ...item, unitPrice: item.unitPrice },
    });
  }

  console.log(`✓ Price book seeded (${priceBookItems.length} items)`);
  console.log('\n✅ Job-service seed complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
