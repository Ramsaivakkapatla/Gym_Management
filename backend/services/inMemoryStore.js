/**
 * Temporary Local Database Store (File-Persisted)
 * 
 * Runs 100% locally without requiring MongoDB.
 * Persists data to backend/data/gym_db.json so data is preserved across server restarts.
 * Implements complete Admin Auth, Member CRUD, Plan CRUD, Membership Assignment with date math,
 * and Case 1 & Case 2 Renewals with Audit History.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const {
  addCalendarMonths,
  normalizeToDateOnly,
  getTodayDateOnly,
  computeMembershipStatus,
} = require('../utils/dateUtils');

const DB_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DB_DIR, 'gym_db.json');

class TemporaryDB {
  constructor() {
    this.admins = [];
    this.members = [];
    this.plans = [];
    this.memberships = [];
    this.renewals = [];
    this.initialized = false;
  }

  async saveToFile() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const data = {
        admins: this.admins,
        members: this.members,
        plans: this.plans,
        memberships: this.memberships,
        renewals: this.renewals,
        updatedAt: new Date().toISOString(),
      };
      await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving temporary database to file:', err.message);
    }
  }

  async init() {
    if (this.initialized) return;

    // Check if persistent file exists
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = await fs.promises.readFile(DB_FILE, 'utf8');
        const parsed = JSON.parse(fileContent);
        this.admins = parsed.admins || [];
        this.members = parsed.members || [];
        this.plans = parsed.plans || [];
        this.memberships = parsed.memberships || [];
        this.renewals = parsed.renewals || [];
        this.initialized = true;
        console.log(`[TemporaryDB] Loaded existing data from ${DB_FILE}`);
        return;
      } catch (err) {
        console.warn('[TemporaryDB] Corrupted database file, re-initializing defaults...');
      }
    }

    // Initialize Default Seed Data
    console.log('[TemporaryDB] Initializing default seed data...');

    // 1. Seed Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    this.admins.push({
      _id: 'admin_001',
      name: 'Gym Administrator',
      email: 'admin@gym.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

    // 2. Seed Plans
    this.plans = [
      {
        _id: 'plan_001',
        name: 'Monthly Standard',
        durationMonths: 1,
        price: 50,
        description: 'Full gym floor access with cardio and weight training for 1 month.',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'plan_002',
        name: 'Quarterly Fitness',
        durationMonths: 3,
        price: 135,
        description: 'Quarterly membership including locker room and steam bath access.',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'plan_003',
        name: 'Half-Year Elite',
        durationMonths: 6,
        price: 250,
        description: '6 months full access with weekend group fitness sessions.',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'plan_004',
        name: 'Annual VIP Pro',
        durationMonths: 12,
        price: 450,
        description: 'Complete 365-day all-access membership with maximum savings.',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    // 3. Seed Members
    const m1 = {
      _id: 'mem_001',
      memberId: 'MBR-1001',
      name: 'Alex Johnson',
      email: 'alex.j@example.com',
      phone: '9876543210',
      gender: 'Male',
      dob: '1995-05-15',
      address: '123 Baker Street, City Center',
      isActive: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const m2 = {
      _id: 'mem_002',
      memberId: 'MBR-1002',
      name: 'Sarah Connor',
      email: 'sarah.c@example.com',
      phone: '9123456780',
      gender: 'Female',
      dob: '1998-11-20',
      address: '456 Highland Ave, Westside',
      isActive: true,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const m3 = {
      _id: 'mem_003',
      memberId: 'MBR-1003',
      name: 'David Miller',
      email: 'david.m@example.com',
      phone: '9456123789',
      gender: 'Male',
      dob: '1992-03-10',
      address: '789 Sunset Blvd, Downtown',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.members = [m1, m2, m3];

    // 4. Seed Memberships (One active, one expired)
    const today = getTodayDateOnly();
    const annualPlan = this.plans.find((p) => p.durationMonths === 12);
    const monthlyPlan = this.plans.find((p) => p.durationMonths === 1);

    // MBR-1001: Active Annual Membership
    const annualExpiry = addCalendarMonths(today, annualPlan.durationMonths);
    this.memberships.push({
      _id: 'ms_001',
      member: m1,
      plan: annualPlan,
      planSnapshot: {
        name: annualPlan.name,
        durationMonths: annualPlan.durationMonths,
        price: annualPlan.price,
      },
      startDate: today.toISOString(),
      expiryDate: annualExpiry.toISOString(),
      createdAt: today.toISOString(),
    });

    // MBR-1002: Expired Membership (started 3 months ago for 1 month duration)
    const pastStart = addCalendarMonths(today, -3);
    const pastExpiry = addCalendarMonths(pastStart, monthlyPlan.durationMonths);
    this.memberships.push({
      _id: 'ms_002',
      member: m2,
      plan: monthlyPlan,
      planSnapshot: {
        name: monthlyPlan.name,
        durationMonths: monthlyPlan.durationMonths,
        price: monthlyPlan.price,
      },
      startDate: pastStart.toISOString(),
      expiryDate: pastExpiry.toISOString(),
      createdAt: pastStart.toISOString(),
    });

    this.initialized = true;
    await this.saveToFile();
  }

  // --- Auth Methods ---
  async findAdminByEmail(email) {
    await this.init();
    return this.admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  async findAdminById(id) {
    await this.init();
    const a = this.admins.find((adm) => adm._id === id);
    if (!a) return null;
    const { password, ...rest } = a;
    return rest;
  }

  // --- Member Methods ---
  async getAllMembers({ search, status }) {
    await this.init();
    let result = [...this.members];

    if (status === 'active') {
      result = result.filter((m) => m.isActive === true);
    } else if (status === 'inactive') {
      result = result.filter((m) => m.isActive === false);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.memberId.toLowerCase().includes(q)
      );
    }

    return result.map((m) => {
      const memberMemberships = this.memberships
        .filter((ms) => (ms.member._id || ms.member) === m._id)
        .sort((a, b) => new Date(b.expiryDate) - new Date(a.expiryDate));

      const latest = memberMemberships[0];
      return {
        ...m,
        latestMembership: latest
          ? {
              _id: latest._id,
              planName: latest.planSnapshot?.name || 'Custom Plan',
              startDate: latest.startDate,
              expiryDate: latest.expiryDate,
              status: computeMembershipStatus(latest.expiryDate),
            }
          : null,
      };
    });
  }

  async getMemberById(id) {
    await this.init();
    const member = this.members.find((m) => m._id === id);
    if (!member) return null;

    const memberships = this.memberships
      .filter((ms) => (ms.member._id || ms.member) === id)
      .map((ms) => ({
        ...ms,
        status: computeMembershipStatus(ms.expiryDate),
      }))
      .sort((a, b) => new Date(b.expiryDate) - new Date(a.expiryDate));

    const renewalHistory = this.renewals
      .filter((r) => (r.member._id || r.member) === id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { member, memberships, renewalHistory };
  }

  async createMember(data) {
    await this.init();
    const nextNum = 1001 + this.members.length;
    const newMember = {
      _id: `mem_${Date.now()}`,
      memberId: `MBR-${nextNum}`,
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      gender: data.gender,
      dob: data.dob,
      address: data.address ? data.address.trim() : '',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.members.unshift(newMember);
    await this.saveToFile();
    return newMember;
  }

  async updateMember(id, data) {
    await this.init();
    const index = this.members.findIndex((m) => m._id === id);
    if (index === -1) return null;

    this.members[index] = {
      ...this.members[index],
      ...data,
      email: data.email ? data.email.toLowerCase().trim() : this.members[index].email,
      name: data.name ? data.name.trim() : this.members[index].name,
      updatedAt: new Date().toISOString(),
    };
    await this.saveToFile();
    return this.members[index];
  }

  async toggleMemberStatus(id) {
    await this.init();
    const member = this.members.find((m) => m._id === id);
    if (!member) return null;
    member.isActive = !member.isActive;
    await this.saveToFile();
    return member;
  }

  // --- Plan Methods ---
  async getAllPlans({ activeOnly }) {
    await this.init();
    let result = [...this.plans];
    if (activeOnly === 'true') {
      result = result.filter((p) => p.isActive === true);
    }
    return result;
  }

  async createPlan(data) {
    await this.init();
    const newPlan = {
      _id: `plan_${Date.now()}`,
      name: data.name.trim(),
      durationMonths: Number(data.durationMonths),
      price: Number(data.price),
      description: data.description ? data.description.trim() : '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
    };
    this.plans.push(newPlan);
    await this.saveToFile();
    return newPlan;
  }

  async updatePlan(id, data) {
    await this.init();
    const index = this.plans.findIndex((p) => p._id === id);
    if (index === -1) return null;

    this.plans[index] = {
      ...this.plans[index],
      ...data,
      durationMonths: data.durationMonths !== undefined ? Number(data.durationMonths) : this.plans[index].durationMonths,
      price: data.price !== undefined ? Number(data.price) : this.plans[index].price,
      updatedAt: new Date().toISOString(),
    };
    await this.saveToFile();
    return this.plans[index];
  }

  async togglePlanStatus(id) {
    await this.init();
    const plan = this.plans.find((p) => p._id === id);
    if (!plan) return null;
    plan.isActive = !plan.isActive;
    await this.saveToFile();
    return plan;
  }

  // --- Membership Methods ---
  async createMembership({ memberId, planId, startDate }) {
    await this.init();
    const member = this.members.find((m) => m._id === memberId);
    if (!member) throw new Error('Member not found');
    if (!member.isActive) throw new Error('Cannot assign membership to deactivated member');

    const plan = this.plans.find((p) => p._id === planId);
    if (!plan) throw new Error('Membership plan not found');
    if (!plan.isActive) throw new Error('Cannot assign inactive plan');

    const normalizedStart = normalizeToDateOnly(startDate) || getTodayDateOnly();
    const calculatedExpiry = addCalendarMonths(normalizedStart, plan.durationMonths);

    // Overlapping check
    const overlapping = this.memberships.find((ms) => {
      const msMemberId = ms.member._id || ms.member;
      if (msMemberId !== memberId) return false;
      const msStart = normalizeToDateOnly(ms.startDate);
      const msExpiry = normalizeToDateOnly(ms.expiryDate);
      return msStart <= calculatedExpiry && msExpiry >= normalizedStart;
    });

    if (overlapping) {
      const exStart = new Date(overlapping.startDate).toISOString().split('T')[0];
      const exExp = new Date(overlapping.expiryDate).toISOString().split('T')[0];
      throw new Error(`Member already has an active or overlapping membership from ${exStart} to ${exExp}. Please renew or choose a future start date.`);
    }

    const newMs = {
      _id: `ms_${Date.now()}`,
      member,
      plan,
      planSnapshot: {
        name: plan.name,
        durationMonths: plan.durationMonths,
        price: plan.price,
      },
      startDate: normalizedStart.toISOString(),
      expiryDate: calculatedExpiry.toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.memberships.unshift(newMs);
    await this.saveToFile();
    return { ...newMs, status: computeMembershipStatus(newMs.expiryDate) };
  }

  async getAllMemberships() {
    await this.init();
    return this.memberships.map((m) => ({
      ...m,
      status: computeMembershipStatus(m.expiryDate),
    }));
  }

  async getMembershipsByStatus(statusType) {
    await this.init();
    return this.memberships
      .map((m) => ({ ...m, status: computeMembershipStatus(m.expiryDate) }))
      .filter((m) => m.status.toLowerCase() === statusType.toLowerCase());
  }

  async getMembershipsByMember(memberId) {
    await this.init();
    return this.memberships
      .filter((m) => (m.member._id || m.member) === memberId)
      .map((m) => ({ ...m, status: computeMembershipStatus(m.expiryDate) }));
  }

  // --- Renewal Methods ---
  async processRenewal({ membershipId, planId, renewalDateInput }) {
    await this.init();
    const existing = this.memberships.find((m) => m._id === membershipId);
    if (!existing) throw new Error('Existing membership not found');

    const member = this.members.find((m) => m._id === (existing.member._id || existing.member));
    if (!member) throw new Error('Member not found');
    if (!member.isActive) throw new Error('Cannot renew membership for a deactivated member');

    const plan = this.plans.find((p) => p._id === planId);
    if (!plan) throw new Error('Selected renewal plan not found');
    if (!plan.isActive) throw new Error('Cannot renew using an inactive membership plan');

    const renewalDate = renewalDateInput ? normalizeToDateOnly(renewalDateInput) : getTodayDateOnly();
    const existingExpiryDate = normalizeToDateOnly(existing.expiryDate);

    const isBeforeOrOnExpiry = renewalDate.getTime() <= existingExpiryDate.getTime();

    let renewalType;
    let newStartDate;
    let newExpiryDate;
    let targetMembership;

    if (isBeforeOrOnExpiry) {
      // Case 1: Early Extension from existing expiry
      renewalType = 'EARLY_EXTEND';
      newStartDate = existingExpiryDate;
      newExpiryDate = addCalendarMonths(existingExpiryDate, plan.durationMonths);
      existing.expiryDate = newExpiryDate.toISOString();
      existing.plan = plan;
      existing.planSnapshot = {
        name: plan.name,
        durationMonths: plan.durationMonths,
        price: plan.price,
      };
      targetMembership = existing;
    } else {
      // Case 2: Late Renewal starting from renewal date
      renewalType = 'LATE_RENEWAL';
      newStartDate = renewalDate;
      newExpiryDate = addCalendarMonths(renewalDate, plan.durationMonths);

      const newMs = {
        _id: `ms_${Date.now()}`,
        member,
        plan,
        planSnapshot: {
          name: plan.name,
          durationMonths: plan.durationMonths,
          price: plan.price,
        },
        startDate: newStartDate.toISOString(),
        expiryDate: newExpiryDate.toISOString(),
        createdAt: new Date().toISOString(),
      };
      this.memberships.unshift(newMs);
      targetMembership = newMs;
    }

    const renewalRecord = {
      _id: `ren_${Date.now()}`,
      member,
      membership: targetMembership,
      plan,
      planSnapshot: {
        name: plan.name,
        durationMonths: plan.durationMonths,
        amount: plan.price,
      },
      previousExpiryDate: existingExpiryDate.toISOString(),
      newStartDate: newStartDate.toISOString(),
      newExpiryDate: newExpiryDate.toISOString(),
      renewalType,
      renewalDate: renewalDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.renewals.unshift(renewalRecord);
    await this.saveToFile();

    return {
      membership: { ...targetMembership, status: computeMembershipStatus(targetMembership.expiryDate) },
      renewalRecord,
      renewalType,
      message:
        renewalType === 'EARLY_EXTEND'
          ? `Membership extended from existing expiry date to ${newExpiryDate.toISOString().split('T')[0]}`
          : `New membership activated from renewal date to ${newExpiryDate.toISOString().split('T')[0]}`,
    };
  }

  async getAllRenewals() {
    await this.init();
    return this.renewals;
  }

  async getRenewalsByMember(memberId) {
    await this.init();
    return this.renewals.filter((r) => (r.member._id || r.member) === memberId);
  }

  // --- Dashboard Stats ---
  async getDashboardStats() {
    await this.init();
    const today = getTodayDateOnly();

    const totalMembers = this.members.length;
    const activeMemberships = this.memberships.filter(
      (m) => normalizeToDateOnly(m.expiryDate).getTime() >= today.getTime()
    ).length;
    const expiredMemberships = this.memberships.filter(
      (m) => normalizeToDateOnly(m.expiryDate).getTime() < today.getTime()
    ).length;
    const totalPlans = this.plans.length;

    const recentMemberships = this.memberships.slice(0, 5).map((m) => ({
      ...m,
      status: computeMembershipStatus(m.expiryDate),
    }));

    return {
      totalMembers,
      activeMemberships,
      expiredMemberships,
      totalPlans,
      recentMemberships,
    };
  }
}

const temporaryDB = new TemporaryDB();
module.exports = temporaryDB;
