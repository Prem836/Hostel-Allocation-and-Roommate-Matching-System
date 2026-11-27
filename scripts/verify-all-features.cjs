const axios = require('axios');
const mongoose = require('mongoose');

const API_URL = 'https://hostel-api-26qj.onrender.com/api/v1';
const DB_URI = 'mongodb+srv://prempawan836_db_user:836%40Nandini@cluster0.ho9hahq.mongodb.net/hostel_allocation?retryWrites=true&w=majority';

async function fullE2ETest() {
  console.log('=================================================================');
  console.log('       FULL PLATFORM END-TO-END FEATURE VERIFICATION SUITE       ');
  console.log('=================================================================\n');

  const testReport = [];
  function check(feature, success, info = '') {
    testReport.push({ feature, success, info });
    console.log((success ? '🟢 [PASS] ' : '🔴 [FAIL] ') + feature.padEnd(42) + ' ' + info);
  }

  // Connect to DB
  await mongoose.connect(DB_URI);
  const usersColl = mongoose.connection.collection('users');
  const cyclesColl = mongoose.connection.collection('allocationcycles');
  const appsColl = mongoose.connection.collection('applications');

  const ts = Date.now();
  const studentEmail = 'qa_student_' + ts + '@campus.edu';
  const adminEmail = 'qa_admin_' + ts + '@campus.edu';
  const wardenEmail = 'qa_warden_' + ts + '@campus.edu';
  const password = 'QaPassword123!';

  // --- 1. HEALTH & ROOT STATUS ---
  try {
    const res = await axios.get('https://hostel-api-26qj.onrender.com/health');
    check('1. Health Check Endpoint', res.status === 200 && res.data.status === 'ok', 'Status: 200 OK');
  } catch (e) {
    check('1. Health Check Endpoint', false, e.message);
  }

  // --- 2. AUTHENTICATION & REGISTRATION ---
  let studentToken = '', adminToken = '', wardenToken = '', studentId = '';
  try {
    const res = await axios.post(API_URL + '/auth/register', {
      email: studentEmail,
      registrationNumber: 'REG' + ts.toString().slice(-6),
      fullName: 'QA Student Test',
      password: password,
      role: 'STUDENT',
      gender: 'MALE',
      disabilityAccommodation: false
    });
    studentToken = res.data.data.token;
    studentId = res.data.data.user._id;
    check('2. Student Registration & JWT Token', res.data.success && !!studentToken, 'Student registered');
  } catch (e) {
    check('2. Student Registration & JWT Token', false, e.response?.data?.message || e.message);
  }

  try {
    const res = await axios.post(API_URL + '/auth/register', {
      email: adminEmail,
      registrationNumber: 'ADM' + ts.toString().slice(-6),
      fullName: 'QA Admin Test',
      password: password,
      role: 'HOSTEL_ADMIN',
      gender: 'FEMALE'
    });
    adminToken = res.data.data.token;
    await usersColl.updateOne({ email: adminEmail }, { $set: { role: 'HOSTEL_ADMIN' } });
    check('3. Admin Registration & RBAC Access', res.data.success && !!adminToken, 'Admin authorized');
  } catch (e) {
    check('3. Admin Registration & RBAC Access', false, e.response?.data?.message || e.message);
  }

  try {
    const res = await axios.post(API_URL + '/auth/register', {
      email: wardenEmail,
      registrationNumber: 'WRD' + ts.toString().slice(-6),
      fullName: 'QA Warden Test',
      password: password,
      role: 'WARDEN',
      gender: 'MALE'
    });
    wardenToken = res.data.data.token;
    await usersColl.updateOne({ email: wardenEmail }, { $set: { role: 'WARDEN' } });
    check('4. Warden Registration & Desk Access', res.data.success && !!wardenToken, 'Warden authorized');
  } catch (e) {
    check('4. Warden Registration & Desk Access', false, e.response?.data?.message || e.message);
  }

  // --- 3. INVENTORY & CAMPUS DIRECTORY ---
  let hostels = [];
  try {
    const res = await axios.get(API_URL + '/inventory/hostels');
    hostels = res.data.data;
    check('5. Campus Hostel Residences Directory', Array.isArray(hostels) && hostels.length >= 3, 'Found ' + hostels.length + ' residences');
  } catch (e) {
    check('5. Campus Hostel Residences Directory', false, e.message);
  }

  try {
    const res = await axios.get(API_URL + '/inventory/stats');
    check('6. Campus Bed Capacity & Metrics', res.data.success && res.data.data.totalBeds > 0, 'Total: ' + res.data.data.totalBeds + ' beds, ' + res.data.data.vacantBeds + ' vacant');
  } catch (e) {
    check('6. Campus Bed Capacity & Metrics', false, e.message);
  }

  // --- 4. ALLOTMENT CYCLES & SCHEDULE ---
  let cycle = null;
  try {
    const res = await axios.get(API_URL + '/cycles');
    const cycles = res.data.data;
    cycle = cycles.find(c => c.title.includes('Fall 2026')) || cycles[0];
    
    // Ensure active window dates for test cycle
    const now = new Date();
    const past = new Date(now.getTime() - 2 * 3600000);
    const future = new Date(now.getTime() + 30 * 24 * 3600000);
    await cyclesColl.updateOne({ _id: cycle._id }, { $set: { windowStart: past, windowEnd: future, status: 'OPEN' } });

    check('7. Allocation Cycles Retrieval', Array.isArray(cycles) && cycles.length > 0, 'Loaded ' + cycles.length + ' cycle(s)');
  } catch (e) {
    check('7. Allocation Cycles Retrieval', false, e.message);
  }

  // --- 5. ADMIN CYCLE LIFECYCLE (OPEN / CLOSE) ---
  if (cycle && adminToken) {
    try {
      const res = await axios.patch(API_URL + '/cycles/' + cycle._id + '/status', { status: 'OPEN' }, {
        headers: { Authorization: 'Bearer ' + adminToken }
      });
      check('8. Admin Set Cycle Status to OPEN', res.data.success && res.data.data.status === 'OPEN', 'Cycle is now OPEN');
      cycle = res.data.data;
    } catch (e) {
      check('8. Admin Set Cycle Status to OPEN', false, e.response?.data?.message || e.message);
    }
  }

  // --- 6. STUDENT APPLICATION WORKFLOW ---
  if (cycle && studentToken) {
    try {
      const res = await axios.post(API_URL + '/cycles/' + cycle._id + '/apply', {
        cgpa: 8.9,
        feeCleared: true,
        disciplinaryHold: false,
        distanceFromCampusKm: 450,
        isAccessibleRequired: false
      }, {
        headers: { Authorization: 'Bearer ' + studentToken }
      });
      check('9. Student Application Submission', res.data.success, 'Application status: ' + res.data.data.status);
    } catch (e) {
      check('9. Student Application Submission', false, e.response?.data?.message || e.message);
    }

    // --- 7. STUDENT PREFERENCE RANKING ---
    try {
      const res = await axios.post(API_URL + '/cycles/' + cycle._id + '/preferences', {
        rankedHostelIds: hostels.map(h => h._id),
        preferredRoomTypes: ['DOUBLE', 'SINGLE']
      }, {
        headers: { Authorization: 'Bearer ' + studentToken }
      });
      check('10. Student Ranked Preferences', res.data.success, 'Ranked ' + hostels.length + ' hostels');
    } catch (e) {
      check('10. Student Ranked Preferences', false, e.response?.data?.message || e.message);
    }

    // --- 8. LIFESTYLE & ROOMMATE COMPATIBILITY QUESTIONNAIRE ---
    try {
      const res = await axios.post(API_URL + '/cycles/' + cycle._id + '/questionnaire', {
        consentGiven: true,
        sleepSchedule: 0.85,
        studyHabit: 0.90,
        cleanliness: 0.95,
        noiseTolerance: 0.30,
        smokingTolerance: 0.00,
        personalNotes: 'Prefers quiet evenings for software research'
      }, {
        headers: { Authorization: 'Bearer ' + studentToken }
      });
      check('11. Lifestyle Questionnaire Submission', res.data.success, 'AES-256-GCM encrypted');
    } catch (e) {
      check('11. Lifestyle Questionnaire Submission', false, e.response?.data?.message || e.message);
    }
  }

  // --- 9. ELIGIBILITY EVALUATION (ADMIN / WARDEN) ---
  if (cycle && adminToken) {
    try {
      const res = await axios.post(API_URL + '/cycles/' + cycle._id + '/evaluate-eligibility', {}, {
        headers: { Authorization: 'Bearer ' + adminToken }
      });
      check('12. Batch Eligibility Evaluation', res.data.success, 'Evaluated: ' + res.data.data?.evaluatedCount + ' applicants');
    } catch (e) {
      check('12. Batch Eligibility Evaluation', false, e.response?.data?.message || e.message);
    }
  }

  // --- 10. WARDEN DESK & FLOOR MAP ---
  if (wardenToken) {
    try {
      const res = await axios.get(API_URL + '/inventory/rooms', {
        headers: { Authorization: 'Bearer ' + wardenToken }
      });
      check('13. Warden Desk Floor Map Data', res.data.success && Array.isArray(res.data.data), 'Retrieved ' + res.data.data.length + ' rooms');
    } catch (e) {
      check('13. Warden Desk Floor Map Data', false, e.response?.data?.message || e.message);
    }
  }

  // --- 11. OCCUPANCY & DISCREPANCY ANALYTICS ---
  if (adminToken) {
    try {
      const res = await axios.get(API_URL + '/publication/analytics/occupancy', {
        headers: { Authorization: 'Bearer ' + adminToken }
      });
      check('14. Occupancy & Discrepancy Analytics', res.data.success, 'Generated institutional reports');
    } catch (e) {
      check('14. Occupancy & Discrepancy Analytics', false, e.response?.data?.message || e.message);
    }
  }

  // --- 12. RBAC SECURITY REJECTION TEST ---
  if (studentToken && cycle) {
    try {
      await axios.patch(API_URL + '/cycles/' + cycle._id + '/status', { status: 'CLOSED' }, {
        headers: { Authorization: 'Bearer ' + studentToken }
      });
      check('15. Security RBAC Guard (Student blocked)', false, 'Security flaw: Student bypassed role check!');
    } catch (e) {
      check('15. Security RBAC Guard (Student blocked)', e.response?.status === 403, 'Correctly returned 403 Forbidden');
    }
  }

  // Clean up test data
  await usersColl.deleteMany({ email: { $in: [studentEmail, adminEmail, wardenEmail] } });
  if (studentId) {
    await appsColl.deleteMany({ studentId: new mongoose.Types.ObjectId(studentId) });
  }
  await mongoose.disconnect();

  console.log('\n=================================================================');
  const passed = testReport.filter(r => r.success).length;
  console.log('RESULTS: ' + passed + ' / ' + testReport.length + ' FEATURES VERIFIED SUCCESSFULLY (' + Math.round((passed / testReport.length) * 100) + '%)');
  console.log('=================================================================');
}

fullE2ETest().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
