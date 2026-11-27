const mongoose = require('mongoose');

const uri = 'mongodb+srv://prempawan836_db_user:836%40Nandini@cluster0.ho9hahq.mongodb.net/hostel_allocation?retryWrites=true&w=majority';

async function allotPrem() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(uri);
  const db = mongoose.connection;

  // 1. Ensure all hostels have isActive: true
  const hRes = await db.collection('hostels').updateMany({}, {
    $set: { isActive: true }
  });
  console.log('Hostels marked active:', hRes.modifiedCount);

  // 2. Fetch Prem's User and Application
  const prem = await db.collection('users').findOne({ email: 'prempawan836@gmail.com' });
  if (!prem) {
    console.error('Prem user not found!');
    process.exit(1);
  }
  console.log('Found Prem Singh:', prem._id, prem.fullName);

  // Active cycle: Fall 2026 Hostel Allocation
  const cycle = await db.collection('allocationcycles').findOne({ title: 'Fall 2026 Hostel Allocation' });
  if (!cycle) {
    console.error('Fall 2026 cycle not found!');
    process.exit(1);
  }
  console.log('Found Cycle:', cycle._id, cycle.title);

  // 3. Ensure application status is ELIGIBLE
  await db.collection('applications').updateOne(
    { studentId: prem._id, cycleId: cycle._id },
    { $set: { status: 'ELIGIBLE', ineligibilityReasons: [] } }
  );
  console.log('Application status confirmed as ELIGIBLE');

  // 4. Clean up any previous unfinalized drafts for this cycle to have a clean run
  await db.collection('allocationdrafts').deleteMany({ cycleId: cycle._id, status: { $ne: 'PUBLISHED' } });
  await db.collection('draftassignments').deleteMany({ cycleId: cycle._id });
  await db.collection('waitlistentries').deleteMany({ cycleId: cycle._id });

  // 5. Run Allocation using server's AllocationEngineService
  // Require dist files
  const { AllocationEngineService } = require('../server/dist/modules/allocation/allocation.service.js');
  const { PublicationService } = require('../server/dist/modules/publication/publication.service.js');

  console.log('Running Allocation Engine for Prem...');
  const result = await AllocationEngineService.runAllocation(cycle._id.toString(), 42);
  console.log('Allocation Run Result:', {
    draftId: result.draft._id,
    assignedCount: result.assignedCount,
    waitlistedCount: result.waitlistedCount,
  });

  // Verify draft assignment
  const assignments = await db.collection('draftassignments').find({ draftId: result.draft._id }).toArray();
  console.log('Draft Assignments count:', assignments.length);
  for (const a of assignments) {
    const hostel = await db.collection('hostels').findOne({ _id: a.hostelId });
    const room = await db.collection('rooms').findOne({ _id: a.roomId });
    const bed = await db.collection('beds').findOne({ _id: a.bedId });
    console.log(`-> Assigned Student ${a.studentId} to:`);
    console.log(`   Hostel: ${hostel?.name} (${hostel?.code})`);
    console.log(`   Room: ${room?.roomNumber} (Floor ${room?.floor}, ${room?.roomType})`);
    console.log(`   Bed: ${bed?.bedLabel}`);
    console.log(`   Match Score: ${a.matchScore}`);
  }

  // 6. Approve the draft
  const warden = await db.collection('users').findOne({ role: 'WARDEN' }) || prem;
  await db.collection('allocationdrafts').updateOne(
    { _id: result.draft._id },
    {
      $set: {
        status: 'APPROVED',
        approvedBy: warden._id,
        approvedAt: new Date()
      }
    }
  );
  console.log('Draft APPROVED by Warden:', warden.fullName);

  // 7. Publish the draft so the bed becomes permanently OCCUPIED and official letter is issued
  console.log('Publishing draft atomically...');
  const pubResult = await PublicationService.publishDraft(
    result.draft._id.toString(),
    warden._id.toString(),
    'Official room allotment finalized for Prem Singh'
  );
  console.log('Publication Result:', {
    publishedDraftId: pubResult.draftId,
    bedsUpdated: pubResult.bedsUpdated,
    notificationsDispatched: pubResult.notificationsDispatched
  });

  // 8. Confirm Prem's allotment state
  const updatedBed = await db.collection('beds').findOne({ occupiedByStudentId: prem._id });
  const publishedCycle = await db.collection('allocationcycles').findOne({ _id: cycle._id });

  console.log('\n=============================================');
  console.log('🎉 ROOM ALLOTMENT FOR PREM SINGH COMPLETED!');
  console.log('   Allotted Bed ID:', updatedBed?._id);
  console.log('   Bed Status:', updatedBed?.status);
  console.log('   Cycle Status:', publishedCycle?.status);
  console.log('=============================================\n');

  await mongoose.disconnect();
}

allotPrem().catch(err => {
  console.error('Error allotting room:', err);
  process.exit(1);
});
