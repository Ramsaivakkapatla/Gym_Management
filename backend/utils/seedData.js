const Admin = require('../models/Admin');
const Plan = require('../models/Plan');
const Member = require('../models/Member');
const Membership = require('../models/Membership');
const { addCalendarMonths, getTodayDateOnly } = require('./dateUtils');

const seedInitialData = async () => {
  try {
    // 1. Seed Default Admin if none exists
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const defaultAdmin = new Admin({
        name: 'Gym Administrator',
        email: 'admin@gym.com',
        password: 'admin123',
        role: 'admin',
      });
      await defaultAdmin.save();
      console.log('✅ Default Admin created: admin@gym.com / admin123');
    }

    // 2. Seed Default Plans if none exist
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      const plans = [
        {
          name: 'Monthly Standard',
          durationMonths: 1,
          price: 50,
          description: 'Full gym floor access with cardio and weight training for 1 month.',
          isActive: true,
        },
        {
          name: 'Quarterly Fitness',
          durationMonths: 3,
          price: 135,
          description: 'Quarterly membership including locker room and steam bath access.',
          isActive: true,
        },
        {
          name: 'Half-Year Elite',
          durationMonths: 6,
          price: 250,
          description: '6 months full access with weekend group fitness sessions.',
          isActive: true,
        },
        {
          name: 'Annual VIP Pro',
          durationMonths: 12,
          price: 450,
          description: 'Complete 365-day all-access membership with maximum savings.',
          isActive: true,
        },
      ];
      await Plan.insertMany(plans);
      console.log('✅ Default Membership Plans seeded successfully.');
    }

    // 3. Optional: Seed initial demo members and memberships if database is completely empty
    const memberCount = await Member.countDocuments();
    if (memberCount === 0) {
      const samplePlans = await Plan.find({ isActive: true });
      const monthlyPlan = samplePlans.find((p) => p.durationMonths === 1) || samplePlans[0];
      const annualPlan = samplePlans.find((p) => p.durationMonths === 12) || samplePlans[1];

      const member1 = new Member({
        name: 'Alex Johnson',
        email: 'alex.j@example.com',
        phone: '9876543210',
        gender: 'Male',
        dob: new Date('1995-05-15'),
        address: '123 Baker Street, City Center',
        isActive: true,
      });
      await member1.save();

      const member2 = new Member({
        name: 'Sarah Connor',
        email: 'sarah.c@example.com',
        phone: '9123456780',
        gender: 'Female',
        dob: new Date('1998-11-20'),
        address: '456 Highland Ave, Westside',
        isActive: true,
      });
      await member2.save();

      const member3 = new Member({
        name: 'David Miller',
        email: 'david.m@example.com',
        phone: '9456123789',
        gender: 'Male',
        dob: new Date('1992-03-10'),
        address: '789 Sunset Blvd, Downtown',
        isActive: true,
      });
      await member3.save();

      // Member 1: Active Annual Membership
      const today = getTodayDateOnly();
      const annualExpiry = addCalendarMonths(today, annualPlan.durationMonths);
      await Membership.create({
        member: member1._id,
        plan: annualPlan._id,
        planSnapshot: {
          name: annualPlan.name,
          durationMonths: annualPlan.durationMonths,
          price: annualPlan.price,
        },
        startDate: today,
        expiryDate: annualExpiry,
      });

      // Member 2: Expired Membership (started 3 months ago for 1 month duration)
      const pastStart = addCalendarMonths(today, -3);
      const pastExpiry = addCalendarMonths(pastStart, monthlyPlan.durationMonths);
      await Membership.create({
        member: member2._id,
        plan: monthlyPlan._id,
        planSnapshot: {
          name: monthlyPlan.name,
          durationMonths: monthlyPlan.durationMonths,
          price: monthlyPlan.price,
        },
        startDate: pastStart,
        expiryDate: pastExpiry,
      });

      console.log('✅ Demo Members and sample Active/Expired Memberships created.');
    }
  } catch (err) {
    console.error('Error during initial data seeding:', err.message);
  }
};

module.exports = { seedInitialData };

