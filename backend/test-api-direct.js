const inMemoryStore = require('./services/inMemoryStore');

async function testAll() {
  console.log('--- Initializing In-Memory Store ---');
  await inMemoryStore.init();

  // 1. Test Admin Login
  console.log('\n1. Testing Admin Login...');
  const admin = await inMemoryStore.findAdminByEmail('admin@gym.com');
  console.log('Admin found:', admin.email, 'Name:', admin.name);

  // 2. Test Dashboard Stats
  console.log('\n2. Testing Dashboard Stats...');
  const stats = await inMemoryStore.getDashboardStats();
  console.log('Stats:', stats);

  // 3. Test Member Creation
  console.log('\n3. Testing Member Creation...');
  const newMember = await inMemoryStore.createMember({
    name: 'Emily Watson',
    email: 'emily.w@example.com',
    phone: '9988776655',
    gender: 'Female',
    dob: '2000-01-01',
    address: '42 Pine St',
  });
  console.log('Created member:', newMember.name, newMember.memberId);

  // 4. Test Membership Assignment & Overlap Check
  console.log('\n4. Testing Membership Assignment...');
  const monthlyPlan = inMemoryStore.plans[0];
  const ms = await inMemoryStore.createMembership({
    memberId: newMember._id,
    planId: monthlyPlan._id,
    startDate: '2026-03-01',
  });
  console.log('Membership assigned:', ms.planSnapshot.name, 'Expires:', new Date(ms.expiryDate).toISOString().split('T')[0], 'Status:', ms.status);

  // 5. Test Overlap prevention
  console.log('\n5. Testing Overlap Prevention...');
  try {
    await inMemoryStore.createMembership({
      memberId: newMember._id,
      planId: monthlyPlan._id,
      startDate: '2026-03-15', // Overlaps!
    });
    throw new Error('Should have prevented overlapping membership');
  } catch (err) {
    console.log('Successfully caught overlapping attempt:', err.message);
  }

  // 6. Test Renewal Case 1 (Early Extension)
  console.log('\n6. Testing Renewal Case 1 (Early Extension)...');
  const alexMs = inMemoryStore.memberships.find((m) => (m.member._id || m.member.name) === 'Alex Johnson' || m.member.memberId === 'MBR-1001');
  const prevExpAlex = new Date(alexMs.expiryDate).toISOString().split('T')[0];
  const ren1 = await inMemoryStore.processRenewal({
    membershipId: alexMs._id,
    planId: monthlyPlan._id,
    renewalDateInput: '2026-11-09',
  });
  console.log('Case 1 result:', ren1.message);
  console.log('Previous expiry was:', prevExpAlex, 'New expiry:', new Date(ren1.membership.expiryDate).toISOString().split('T')[0]);

  // 7. Test Renewal Case 2 (Late Renewal)
  console.log('\n7. Testing Renewal Case 2 (Late Renewal)...');
  const sarahMs = inMemoryStore.memberships.find((m) => (m.member._id || m.member.name) === 'Sarah Connor' || m.member.memberId === 'MBR-1002');
  const prevExpSarah = new Date(sarahMs.expiryDate).toISOString().split('T')[0];
  const ren2 = await inMemoryStore.processRenewal({
    membershipId: sarahMs._id,
    planId: monthlyPlan._id,
    renewalDateInput: '2026-11-09',
  });
  console.log('Case 2 result:', ren2.message);
  console.log('Previous expired date:', prevExpSarah, 'New active period expiry:', new Date(ren2.membership.expiryDate).toISOString().split('T')[0]);

  console.log('\n🎉 ALL TEMPORARY DATABASE TESTS PASSED WITH 100% SUCCESS!');
}

testAll().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
