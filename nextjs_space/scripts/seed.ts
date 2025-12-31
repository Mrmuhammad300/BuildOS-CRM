import { prisma } from '../lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.punchItem.deleteMany();
  await prisma.changeOrder.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.submittalComment.deleteMany();
  await prisma.submittalResponse.deleteMany();
  await prisma.submittal.deleteMany();
  await prisma.rFIComment.deleteMany();
  await prisma.rFIResponse.deleteMany();
  await prisma.rFI.deleteMany();
  await prisma.projectTeam.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data');

  // Create users with different roles
  const hashedPassword = await bcrypt.hash('johndoe123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'Admin',
    },
  });

  const projectManager = await prisma.user.create({
    data: {
      email: 'sarah.johnson@example.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'ProjectManager',
    },
  });

  const superintendent = await prisma.user.create({
    data: {
      email: 'mike.brown@example.com',
      password: hashedPassword,
      firstName: 'Mike',
      lastName: 'Brown',
      role: 'Superintendent',
    },
  });

  const architect = await prisma.user.create({
    data: {
      email: 'emily.davis@example.com',
      password: hashedPassword,
      firstName: 'Emily',
      lastName: 'Davis',
      role: 'Architect',
    },
  });

  const engineer = await prisma.user.create({
    data: {
      email: 'robert.wilson@example.com',
      password: hashedPassword,
      firstName: 'Robert',
      lastName: 'Wilson',
      role: 'Engineer',
    },
  });

  const fieldStaff = await prisma.user.create({
    data: {
      email: 'james.martinez@example.com',
      password: hashedPassword,
      firstName: 'James',
      lastName: 'Martinez',
      role: 'FieldStaff',
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: 'linda.taylor@example.com',
      password: hashedPassword,
      firstName: 'Linda',
      lastName: 'Taylor',
      role: 'Owner',
    },
  });

  console.log('Created users');

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Downtown Office Complex',
      client: 'Skyline Properties LLC',
      projectNumber: 'PRJ-2024-001',
      address: '1234 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      startDate: new Date('2024-01-15'),
      estimatedCompletion: new Date('2025-06-30'),
      budget: 15000000,
      status: 'Active',
      phase: 'Framing',
      description: 'Construction of a 12-story mixed-use office building with retail space on ground floor. Project includes underground parking, rooftop amenities, and sustainable design features.',
      projectManagerId: projectManager.id,
      superintendentId: superintendent.id,
      architectId: architect.id,
      engineerId: engineer.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Riverside Residential Development',
      client: 'Harmony Homes Inc',
      projectNumber: 'PRJ-2024-002',
      address: '5678 River Road',
      city: 'Portland',
      state: 'OR',
      zipCode: '97201',
      startDate: new Date('2024-03-01'),
      estimatedCompletion: new Date('2025-12-15'),
      budget: 8500000,
      status: 'Active',
      phase: 'Foundation',
      description: 'Development of 24 luxury townhomes along the Willamette River. Features include energy-efficient systems, private patios, and community green spaces.',
      projectManagerId: projectManager.id,
      superintendentId: superintendent.id,
      architectId: architect.id,
      engineerId: engineer.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Tech Campus Expansion',
      client: 'InnovateTech Corporation',
      projectNumber: 'PRJ-2024-003',
      address: '9999 Innovation Drive',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      startDate: new Date('2023-09-01'),
      estimatedCompletion: new Date('2025-03-31'),
      budget: 25000000,
      status: 'Active',
      phase: 'MEP',
      description: 'Expansion of existing tech campus with new research and development facilities, cafeteria, fitness center, and collaborative workspaces.',
      projectManagerId: admin.id,
      superintendentId: superintendent.id,
      architectId: architect.id,
      engineerId: engineer.id,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      name: 'Healthcare Facility Renovation',
      client: 'MediCare Partners',
      projectNumber: 'PRJ-2023-015',
      address: '777 Hospital Avenue',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      startDate: new Date('2023-06-01'),
      estimatedCompletion: new Date('2024-05-31'),
      actualCompletion: new Date('2024-05-28'),
      budget: 4200000,
      status: 'Completed',
      phase: 'Closeout',
      description: 'Complete renovation of outpatient clinic including updated MEP systems, new medical equipment installation, and modern patient care areas.',
      projectManagerId: projectManager.id,
      superintendentId: superintendent.id,
      architectId: architect.id,
      engineerId: engineer.id,
    },
  });

  const project5 = await prisma.project.create({
    data: {
      name: 'Waterfront Hotel & Conference Center',
      client: 'Coastal Hospitality Group',
      projectNumber: 'PRJ-2025-001',
      address: '2500 Oceanview Boulevard',
      city: 'San Diego',
      state: 'CA',
      zipCode: '92101',
      startDate: new Date('2025-02-01'),
      estimatedCompletion: new Date('2026-11-30'),
      budget: 32000000,
      status: 'PreConstruction',
      phase: 'Planning',
      description: 'Construction of 250-room luxury hotel with conference facilities, restaurants, spa, and direct beach access.',
      projectManagerId: admin.id,
      superintendentId: superintendent.id,
      architectId: architect.id,
      engineerId: engineer.id,
    },
  });

  console.log('Created projects');

  // Create project teams
  await prisma.projectTeam.createMany({
    data: [
      { projectId: project1.id, userId: fieldStaff.id, role: 'Field Worker' },
      { projectId: project1.id, userId: owner.id, role: 'Observer' },
      { projectId: project2.id, userId: fieldStaff.id, role: 'Field Worker' },
      { projectId: project3.id, userId: fieldStaff.id, role: 'Lead Field Technician' },
    ],
  });

  console.log('Created project teams');

  // Create RFIs
  const rfi1 = await prisma.rFI.create({
    data: {
      rfiNumber: 'RFI-2024-0001',
      projectId: project1.id,
      subject: 'Structural Steel Connection Detail Clarification',
      question: 'Drawing S-301 shows a bolted connection at grid line D-5, but the detail appears to conflict with the welded connection specified in the structural notes. Please clarify which connection type should be used and provide an updated detail if necessary.',
      drawingReference: 'S-301, Detail 7',
      specSection: '05 12 00 - Structural Steel Framing',
      priority: 'High',
      status: 'OfficialResponse',
      dueDate: new Date('2024-12-15'),
      costImpact: false,
      scheduleImpact: true,
      estimatedDelayDays: 3,
      submittedById: superintendent.id,
      assignedToId: engineer.id,
      distributionList: [architect.id, projectManager.id],
      attachments: [],
    },
  });

  await prisma.rFIResponse.create({
    data: {
      rfiId: rfi1.id,
      response: 'Use the bolted connection as shown in Detail 7 on Drawing S-301. The welded connection note on that sheet is in error and applies only to connections at grid lines A through C. Updated sketch attached showing proper bolt pattern and spacing.',
      respondedById: engineer.id,
      isDraft: false,
    },
  });

  await prisma.rFIComment.createMany({
    data: [
      {
        rfiId: rfi1.id,
        comment: 'This is critical for our steel erection schedule. Need response by end of week.',
        authorId: superintendent.id,
      },
      {
        rfiId: rfi1.id,
        comment: 'Response received and reviewed. Will proceed with bolted connections.',
        authorId: projectManager.id,
      },
    ],
  });

  const rfi2 = await prisma.rFI.create({
    data: {
      rfiNumber: 'RFI-2024-0002',
      projectId: project1.id,
      subject: 'Exterior Cladding Material Substitution Request',
      question: 'The specified fiber cement panels from manufacturer XYZ are currently on a 16-week lead time, which would delay our schedule. Can we substitute with equivalent panels from ABC Corporation that match all performance specifications and are available in 6 weeks?',
      drawingReference: 'A-401',
      specSection: '07 42 13 - Metal Wall Panels',
      priority: 'Critical',
      status: 'InReview',
      dueDate: new Date('2024-12-10'),
      costImpact: true,
      scheduleImpact: true,
      estimatedDelayDays: 10,
      submittedById: projectManager.id,
      assignedToId: architect.id,
      distributionList: [owner.id],
    },
  });

  const rfi3 = await prisma.rFI.create({
    data: {
      rfiNumber: 'RFI-2024-0003',
      projectId: project2.id,
      subject: 'Foundation Drainage System Configuration',
      question: 'Site conditions show higher water table than indicated in geotechnical report. Should we install additional perimeter drainage or modify the foundation waterproofing system?',
      drawingReference: 'C-201, S-101',
      specSection: '03 30 00 - Cast-in-Place Concrete',
      priority: 'High',
      status: 'Open',
      dueDate: new Date('2024-12-20'),
      costImpact: true,
      scheduleImpact: true,
      estimatedDelayDays: 7,
      submittedById: superintendent.id,
      assignedToId: engineer.id,
      distributionList: [projectManager.id],
    },
  });

  const rfi4 = await prisma.rFI.create({
    data: {
      rfiNumber: 'RFI-2024-0004',
      projectId: project3.id,
      subject: 'HVAC Equipment Room Dimensions',
      question: 'The specified HVAC unit dimensions exceed the equipment room size shown on architectural drawings. Can the room be expanded or should we specify a different unit configuration?',
      drawingReference: 'M-301, A-202',
      specSection: '23 00 00 - HVAC',
      priority: 'Normal',
      status: 'DraftResponse',
      dueDate: new Date('2024-12-18'),
      costImpact: true,
      scheduleImpact: false,
      submittedById: fieldStaff.id,
      assignedToId: architect.id,
      distributionList: [engineer.id, projectManager.id],
    },
  });

  await prisma.rFIResponse.create({
    data: {
      rfiId: rfi4.id,
      response: 'We can expand the equipment room by 3 feet to the north. This will not impact any other spaces. Revised plan in progress.',
      respondedById: architect.id,
      isDraft: true,
    },
  });

  const rfi5 = await prisma.rFI.create({
    data: {
      rfiNumber: 'RFI-2024-0005',
      projectId: project3.id,
      subject: 'Fire Alarm Device Locations',
      question: 'Specification requires smoke detectors in all conference rooms, but drawings only show devices in corridors. Please clarify intent and provide updated locations if needed.',
      drawingReference: 'E-401',
      specSection: '28 31 00 - Fire Detection and Alarm',
      priority: 'Low',
      status: 'Closed',
      dueDate: new Date('2024-11-30'),
      costImpact: false,
      scheduleImpact: false,
      submittedById: superintendent.id,
      assignedToId: engineer.id,
      closedAt: new Date('2024-12-01'),
    },
  });

  await prisma.rFIResponse.create({
    data: {
      rfiId: rfi5.id,
      response: 'Specifications are correct. Install smoke detectors in all conference rooms per spec. Drawing will be updated in next revision.',
      respondedById: engineer.id,
      isDraft: false,
    },
  });

  console.log('Created RFIs with responses and comments');

  // Create daily reports
  await prisma.dailyReport.create({
    data: {
      projectId: project1.id,
      date: new Date('2024-12-28'),
      submittedById: superintendent.id,
      weatherCondition: 'PartlyCloudy',
      temperatureHigh: 58,
      temperatureLow: 42,
      precipitation: 0.0,
      windSpeed: 8,
      contractorWorkers: 12,
      subcontractorWorkers: 18,
      tradesOnSite: ['Structural Steel', 'Concrete', 'Electrical', 'Mechanical'],
      workPerformed: 'Continued structural steel erection on floors 7-8. Installed 45 tons of steel beams. Poured concrete for floor 6 slab (Zone A). Electrical rough-in progressing on floors 4-5. Mechanical ductwork installation started on floor 4.',
      equipmentOnSite: ['Tower Crane #1', 'Tower Crane #2', 'Scissor Lifts (4)', 'Concrete Pump Truck', 'Material Hoist'],
      materialsDelivered: ['Structural steel beams (45 tons)', 'Concrete (120 cubic yards)', 'Electrical conduit and wire', 'HVAC ductwork'],
      incidentsCount: 0,
      nearMissesCount: 1,
      safetyViolations: [],
      ppeComplianceStatus: 'Excellent - 100% compliance observed',
      issuesAndDelays: 'Near miss reported when material was lowered near active work area without proper communication. Crew toolbox talk conducted immediately. Minor delay (1 hour) due to late concrete delivery.',
      inspectionsConducted: ['Floor 6 concrete pour inspection - PASSED', 'Steel connection inspection floors 7-8 - PASSED'],
    },
  });

  await prisma.dailyReport.create({
    data: {
      projectId: project1.id,
      date: new Date('2024-12-27'),
      submittedById: superintendent.id,
      weatherCondition: 'Clear',
      temperatureHigh: 62,
      temperatureLow: 45,
      precipitation: 0.0,
      windSpeed: 5,
      contractorWorkers: 15,
      subcontractorWorkers: 22,
      tradesOnSite: ['Structural Steel', 'Concrete', 'Electrical', 'Plumbing', 'Mechanical'],
      workPerformed: 'Excellent progress day. Completed steel erection for floor 7. Electrical conduit installation completed on floor 4. Plumbing rough-in 75% complete on floor 5. Interior framing started on floor 3.',
      equipmentOnSite: ['Tower Crane #1', 'Tower Crane #2', 'Scissor Lifts (5)', 'Boom Lift', 'Material Hoist'],
      materialsDelivered: ['Structural steel (38 tons)', 'Plumbing fixtures', 'Metal studs for framing'],
      incidentsCount: 0,
      nearMissesCount: 0,
      safetyViolations: [],
      ppeComplianceStatus: 'Excellent - 100% compliance',
      issuesAndDelays: 'None',
      inspectionsConducted: ['Floor 5 plumbing rough-in - PASSED'],
    },
  });

  await prisma.dailyReport.create({
    data: {
      projectId: project2.id,
      date: new Date('2024-12-28'),
      submittedById: superintendent.id,
      weatherCondition: 'Rain',
      temperatureHigh: 52,
      temperatureLow: 41,
      precipitation: 0.8,
      windSpeed: 12,
      contractorWorkers: 8,
      subcontractorWorkers: 10,
      tradesOnSite: ['Concrete', 'Excavation', 'Utilities'],
      workPerformed: 'Limited work due to rain. Completed utility trench excavation for units 12-16. Installed underground storm drainage pipes. Foundation formwork setup for units 8-9 under weather protection.',
      equipmentOnSite: ['Excavator', 'Backhoe', 'Dump Trucks (3)', 'Concrete Pump'],
      materialsDelivered: ['Storm drain pipes', 'Foundation rebar'],
      incidentsCount: 0,
      nearMissesCount: 0,
      safetyViolations: [],
      ppeComplianceStatus: 'Good - rain gear provided to all workers',
      issuesAndDelays: 'Weather delay - concrete pour for units 8-9 postponed to Monday. Site drainage working well, no standing water issues.',
      inspectionsConducted: [],
    },
  });

  await prisma.dailyReport.create({
    data: {
      projectId: project3.id,
      date: new Date('2024-12-28'),
      submittedById: superintendent.id,
      weatherCondition: 'Clear',
      temperatureHigh: 68,
      temperatureLow: 52,
      precipitation: 0.0,
      windSpeed: 6,
      contractorWorkers: 20,
      subcontractorWorkers: 35,
      tradesOnSite: ['Electrical', 'Mechanical', 'Plumbing', 'Fire Protection', 'Drywall', 'Flooring'],
      workPerformed: 'MEP systems installation progressing well. Completed HVAC ductwork in Research Wing. Electrical panel installation 90% complete. Fire sprinkler system testing in Building A. Drywall installation started in cafeteria area. Flooring prep work ongoing.',
      equipmentOnSite: ['Boom Lifts (6)', 'Scissor Lifts (8)', 'Forklifts (3)', 'Man Lifts (4)'],
      materialsDelivered: ['Electrical panels and fixtures', 'Drywall sheets', 'Floor tile'],
      incidentsCount: 0,
      nearMissesCount: 0,
      safetyViolations: [],
      ppeComplianceStatus: 'Excellent - all trades following safety protocols',
      issuesAndDelays: 'None',
      inspectionsConducted: ['Fire sprinkler system hydrostatic test Building A - PASSED', 'Electrical rough-in Research Wing - PASSED'],
    },
  });

  console.log('Created daily reports');

  // Create documents
  await prisma.document.create({
    data: {
      projectId: project1.id,
      filename: 'Master Construction Contract - Skyline Properties.pdf',
      category: 'Contracts',
      discipline: 'General',
      cloudStoragePath: 'documents/contracts/master-contract-001.pdf',
      isPublic: false,
      uploadedById: admin.id,
    },
  });

  await prisma.document.create({
    data: {
      projectId: project1.id,
      filename: 'Architectural Floor Plans - Levels 1-12.pdf',
      category: 'Drawings',
      discipline: 'Architectural',
      cloudStoragePath: 'documents/drawings/arch-floor-plans-rev-c.pdf',
      isPublic: false,
      uploadedById: architect.id,
    },
  });

  await prisma.document.create({
    data: {
      projectId: project1.id,
      filename: 'Structural Engineering Calculations.pdf',
      category: 'Reports',
      discipline: 'Structural',
      cloudStoragePath: 'documents/reports/structural-calcs.pdf',
      isPublic: false,
      uploadedById: engineer.id,
    },
  });

  await prisma.document.create({
    data: {
      projectId: project1.id,
      filename: 'MEP Specifications.pdf',
      category: 'Specifications',
      discipline: 'MEP',
      cloudStoragePath: 'documents/specs/mep-specs-rev-b.pdf',
      isPublic: false,
      uploadedById: engineer.id,
    },
  });

  await prisma.document.create({
    data: {
      projectId: project2.id,
      filename: 'Site Plan and Civil Drawings.pdf',
      category: 'Drawings',
      discipline: 'Civil',
      cloudStoragePath: 'documents/drawings/civil-site-plan.pdf',
      isPublic: false,
      uploadedById: engineer.id,
    },
  });

  await prisma.document.create({
    data: {
      projectId: project3.id,
      filename: 'Electrical System Specifications.pdf',
      category: 'Specifications',
      discipline: 'MEP',
      cloudStoragePath: 'documents/specs/electrical-specs.pdf',
      isPublic: false,
      uploadedById: engineer.id,
    },
  });

  console.log('Created documents');

  // Create submittals
  const submittal1 = await prisma.submittal.create({
    data: {
      projectId: project1.id,
      submittalNumber: 'S-001',
      title: 'Structural Steel Shop Drawings',
      description: 'Detailed shop drawings for structural steel fabrication including beams, columns, and connections for floors 1-5',
      type: 'ShopDrawings',
      specSection: '05 12 00',
      status: 'ArchitectReview',
      priority: 'High',
      dueDate: new Date('2024-12-31'),
      submittedDate: new Date('2024-12-15'),
      submittedById: superintendent.id,
      assignedToId: engineer.id,
      leadTimeDays: 14,
    },
  });

  const submittal2 = await prisma.submittal.create({
    data: {
      projectId: project1.id,
      submittalNumber: 'S-002',
      title: 'HVAC Equipment Product Data',
      description: 'Product data for rooftop HVAC units including specifications, dimensions, and performance data',
      type: 'ProductData',
      specSection: '23 74 00',
      status: 'FinalApproval',
      reviewStatus: 'Approved',
      priority: 'Normal',
      dueDate: new Date('2025-01-15'),
      submittedDate: new Date('2024-12-10'),
      submittedById: fieldStaff.id,
      assignedToId: engineer.id,
      approvedDate: new Date('2024-12-22'),
      leadTimeDays: 21,
    },
  });

  const submittal3 = await prisma.submittal.create({
    data: {
      projectId: project2.id,
      submittalNumber: 'S-003',
      title: 'Curtain Wall System Samples',
      description: 'Physical samples of curtain wall system including glazing, framing, and sealants for design review',
      type: 'Samples',
      specSection: '08 44 00',
      status: 'SubmittedToArchitect',
      priority: 'Critical',
      dueDate: new Date('2025-01-05'),
      submittedDate: new Date('2024-12-20'),
      submittedById: superintendent.id,
      assignedToId: architect.id,
      leadTimeDays: 10,
    },
  });

  const submittal4 = await prisma.submittal.create({
    data: {
      projectId: project2.id,
      submittalNumber: 'S-004',
      title: 'Fire Protection System Shop Drawings',
      description: 'Shop drawings for fire sprinkler system layout and hydraulic calculations',
      type: 'ShopDrawings',
      specSection: '21 13 00',
      status: 'ContractorReview',
      priority: 'High',
      dueDate: new Date('2025-01-20'),
      submittedDate: new Date('2024-12-18'),
      submittedById: fieldStaff.id,
      assignedToId: engineer.id,
      leadTimeDays: 14,
    },
  });

  const submittal5 = await prisma.submittal.create({
    data: {
      projectId: project3.id,
      submittalNumber: 'S-005',
      title: 'Concrete Mix Design Test Reports',
      description: 'Test reports and certificates for concrete mix designs including 28-day strength tests',
      type: 'TestReports',
      specSection: '03 30 00',
      status: 'ContractorReview',
      reviewStatus: 'ReviseAndResubmit',
      priority: 'High',
      dueDate: new Date('2024-12-28'),
      submittedDate: new Date('2024-12-12'),
      submittedById: superintendent.id,
      assignedToId: engineer.id,
      leadTimeDays: 7,
    },
  });

  console.log('Created submittals');

  // Create submittal responses
  await prisma.submittalResponse.create({
    data: {
      submittalId: submittal2.id,
      reviewStatus: 'Approved',
      response: 'All product data meets specifications. Approved for procurement and installation.',
      respondedById: engineer.id,
    },
  });

  await prisma.submittalResponse.create({
    data: {
      submittalId: submittal5.id,
      reviewStatus: 'ReviseAndResubmit',
      response: 'Test results for 28-day strength are below specified minimum. Please retest and resubmit.',
      respondedById: engineer.id,
    },
  });

  console.log('Created submittal responses');

  // Create submittal comments
  await prisma.submittalComment.create({
    data: {
      submittalId: submittal1.id,
      comment: 'Please confirm the connection details match the latest structural revisions dated 12/10/2024.',
      authorId: engineer.id,
    },
  });

  await prisma.submittalComment.create({
    data: {
      submittalId: submittal1.id,
      comment: 'Confirmed. All connections are per latest revision. Updated drawings will be uploaded by EOD.',
      authorId: superintendent.id,
    },
  });

  await prisma.submittalComment.create({
    data: {
      submittalId: submittal3.id,
      comment: 'Samples look good. When can we schedule the mock-up installation for final approval?',
      authorId: architect.id,
    },
  });

  console.log('Created submittal comments');

  // Create change orders
  await prisma.changeOrder.create({
    data: {
      changeOrderNumber: 'CO-2024-0001',
      title: 'Additional HVAC Units for Server Room',
      description: 'Client requested additional cooling capacity for expanded server room on 3rd floor. Requires installation of two additional rooftop HVAC units and associated ductwork.',
      type: 'ClientRequested',
      priority: 'High',
      status: 'Approved',
      proposedCost: 45000,
      approvedCost: 42500,
      actualCost: 43200,
      scheduleImpact: 14,
      reason: 'Client expanded server infrastructure beyond original specifications',
      justification: 'Additional units necessary to meet increased cooling load requirements and maintain optimal operating temperature for server equipment',
      projectId: project1.id,
      requestedById: projectManager.id,
      approvedById: admin.id,
      approvedDate: new Date('2024-12-15'),
      completedDate: new Date('2024-12-28'),
      attachments: ['change-orders/hvac-proposal.pdf', 'change-orders/hvac-drawings.pdf'],
    },
  });

  await prisma.changeOrder.create({
    data: {
      changeOrderNumber: 'CO-2024-0002',
      title: 'Structural Steel Upgrade',
      description: 'Engineer identified need for heavier structural steel beams on floors 4-6 due to updated load calculations',
      type: 'Design',
      priority: 'Critical',
      status: 'Implemented',
      proposedCost: 78000,
      approvedCost: 78000,
      actualCost: 76500,
      scheduleImpact: 7,
      reason: 'Updated structural engineering calculations revealed higher load requirements',
      justification: 'Necessary to meet building code requirements and ensure structural integrity',
      projectId: project1.id,
      requestedById: engineer.id,
      approvedById: admin.id,
      approvedDate: new Date('2024-12-05'),
      completedDate: new Date('2024-12-22'),
    },
  });

  await prisma.changeOrder.create({
    data: {
      changeOrderNumber: 'CO-2024-0003',
      title: 'Underground Utility Relocation',
      description: 'Unexpected underground electrical conduit discovered during excavation, requires relocation and coordination with utility company',
      type: 'Unforeseen',
      priority: 'High',
      status: 'UnderReview',
      proposedCost: 32000,
      scheduleImpact: 10,
      reason: 'Existing underground utilities not shown on as-built drawings',
      justification: 'Required to safely proceed with foundation work and comply with utility easement requirements',
      projectId: project2.id,
      requestedById: superintendent.id,
    },
  });

  await prisma.changeOrder.create({
    data: {
      changeOrderNumber: 'CO-2024-0004',
      title: 'Facade Material Substitution',
      description: 'Substitute originally specified facade panels with upgraded weather-resistant system due to supplier discontinuation',
      type: 'Design',
      priority: 'Normal',
      status: 'Submitted',
      proposedCost: 15000,
      scheduleImpact: 0,
      reason: 'Original facade material discontinued by manufacturer',
      justification: 'Proposed alternative offers improved weather resistance and similar aesthetic at minimal cost increase',
      projectId: project2.id,
      requestedById: architect.id,
    },
  });

  console.log('Created change orders');

  // Create punch items
  await prisma.punchItem.create({
    data: {
      itemNumber: 'PI-00001',
      title: 'Paint touch-up required in lobby',
      description: 'Multiple areas on lobby walls show paint scuffs and need touch-up. Primarily around door frames and high-traffic areas.',
      location: 'Building A - Ground Floor - Main Lobby',
      trade: 'Painting',
      priority: 'Normal',
      status: 'Open',
      estimatedCost: 500,
      dueDate: new Date('2025-01-15'),
      projectId: project1.id,
      identifiedById: architect.id,
      assignedToId: fieldStaff.id,
      attachments: ['punch-items/lobby-paint-issues.jpg'],
    },
  });

  await prisma.punchItem.create({
    data: {
      itemNumber: 'PI-00002',
      title: 'HVAC vent misaligned in conference room',
      description: 'Ceiling air vent not properly aligned with ceiling grid. Needs repositioning to match grid pattern.',
      location: 'Building A - 2nd Floor - Conference Room 201',
      trade: 'HVAC',
      priority: 'Low',
      status: 'InProgress',
      estimatedCost: 250,
      actualCost: 275,
      dueDate: new Date('2025-01-10'),
      projectId: project1.id,
      identifiedById: superintendent.id,
      assignedToId: fieldStaff.id,
      notes: 'Coordinate with ceiling tile installer',
    },
  });

  await prisma.punchItem.create({
    data: {
      itemNumber: 'PI-00003',
      title: 'Electrical outlet not functioning',
      description: 'Wall outlet in executive office (Room 305) is not providing power. Needs testing and repair.',
      location: 'Building A - 3rd Floor - Room 305',
      trade: 'Electrical',
      priority: 'High',
      status: 'Completed',
      estimatedCost: 150,
      actualCost: 125,
      dueDate: new Date('2025-01-05'),
      completedDate: new Date('2024-12-29'),
      projectId: project1.id,
      identifiedById: projectManager.id,
      assignedToId: fieldStaff.id,
      notes: 'Found loose wire connection. Repaired and tested.',
    },
  });

  await prisma.punchItem.create({
    data: {
      itemNumber: 'PI-00004',
      title: 'Door hardware adjustment needed',
      description: 'Entrance door closer needs adjustment. Door closing too quickly and slamming.',
      location: 'Building A - Ground Floor - Main Entrance',
      trade: 'Doors & Hardware',
      priority: 'Normal',
      status: 'Verified',
      estimatedCost: 100,
      actualCost: 100,
      dueDate: new Date('2025-01-08'),
      completedDate: new Date('2024-12-28'),
      verifiedDate: new Date('2024-12-29'),
      projectId: project1.id,
      identifiedById: owner.id,
      assignedToId: fieldStaff.id,
      verifiedById: superintendent.id,
      notes: 'Adjusted closer tension. Tested multiple times. Working properly.',
    },
  });

  await prisma.punchItem.create({
    data: {
      itemNumber: 'PI-00005',
      title: 'Floor tile cracked in restroom',
      description: 'One floor tile in women\'s restroom is cracked and needs replacement.',
      location: 'Building A - 1st Floor - Women\'s Restroom',
      trade: 'Tile & Flooring',
      priority: 'High',
      status: 'Open',
      estimatedCost: 350,
      dueDate: new Date('2025-01-12'),
      projectId: project1.id,
      identifiedById: superintendent.id,
      assignedToId: fieldStaff.id,
      notes: 'Need to order matching tile',
    },
  });

  await prisma.punchItem.create({
    data: {
      itemNumber: 'PI-00006',
      title: 'Window glass has manufacturing defect',
      description: 'Window in unit 402 has visible manufacturing defect in glass (bubble/distortion). Requires replacement under warranty.',
      location: 'Building B - 4th Floor - Unit 402',
      trade: 'Glazing',
      priority: 'Critical',
      status: 'Open',
      estimatedCost: 2500,
      dueDate: new Date('2025-01-20'),
      projectId: project2.id,
      identifiedById: architect.id,
      notes: 'Contact window supplier for warranty claim. Photo documentation attached.',
      attachments: ['punch-items/window-defect-402.jpg'],
    },
  });

  console.log('Created punch items');

  console.log('Seed completed successfully!');
  console.log('\n=== Test Credentials ===');
  console.log('Admin: john@doe.com / johndoe123');
  console.log('Project Manager: sarah.johnson@example.com / johndoe123');
  console.log('Superintendent: mike.brown@example.com / johndoe123');
  console.log('Architect: emily.davis@example.com / johndoe123');
  console.log('Engineer: robert.wilson@example.com / johndoe123');
  console.log('Field Staff: james.martinez@example.com / johndoe123');
  console.log('Owner: linda.taylor@example.com / johndoe123');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
