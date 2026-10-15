/**
 * LYNTRIX HYBRID CLOUD DATABASE & PERSISTENCE ENGINE
 * Powered by Firebase Cloud Firestore with local client-side persistence & auto-sync.
 */

import { cloud, isFirebaseConfigured } from './firebase';

const STORAGE_KEYS = {
  SERVICES: 'lyntrix_cloud_services',
  ADDONS: 'lyntrix_cloud_addons',
  INQUIRIES: 'lyntrix_cloud_inquiries',
  USERS: 'lyntrix_cloud_users',
  CURRENT_USER: 'lyntrix_current_user',
  ADMINS: 'lyntrix_cloud_admins',
  CURRENT_ADMIN: 'lyntrix_current_admin',
  MAINTENANCE: 'lyntrix_cloud_maintenance'
};

const DEFAULT_MAINTENANCE = {
  enabled: false,
  mode: 'banner',
  message: '⚠️ Scheduled Platform Upgrade in Progress. Systems are undergoing routine maintenance.',
  eta: '30 Minutes',
  updatedAt: new Date().toISOString()
};

// Initial Default Admin Accounts in DB
const DEFAULT_ADMINS = [
  {
    id: 'ADM-001',
    email: 'admin@lyntrix.tech',
    password: 'admin123',
    name: 'Dilneth Madushanka',
    role: 'Master Admin',
    createdDate: '2026-08-01',
    status: 'Active'
  },
  {
    id: 'ADM-002',
    email: 'dilneth@lyntrix.tech',
    password: 'admin123',
    name: 'Dilneth Madushanka',
    role: 'Lead Architect & Admin',
    createdDate: '2026-08-01',
    status: 'Active'
  },
  {
    id: 'ADM-003',
    email: 'admin@lyntrixtec.com',
    password: 'admin123',
    name: 'Super Admin',
    role: 'Master Admin',
    createdDate: '2026-08-01',
    status: 'Active'
  }
];

// Initial Default Services
const DEFAULT_SERVICES = [
  {
    id: 'software',
    title: 'Software Development',
    basePrice: 3500,
    badge: 'Core Competency',
    tagline: 'High-performance, scalable custom web & mobile enterprise platforms.',
    description: 'We build enterprise-grade software engineered for high concurrency, security, and effortless maintainability using modern technology stacks.',
    architect: 'Senior Full-Stack Specialist',
    sla: '99.99% Guaranteed'
  },
  {
    id: 'cloud',
    title: 'Cloud Solutions',
    basePrice: 2800,
    badge: 'AWS / Azure / GCP',
    tagline: 'Elastic cloud infrastructure and automated CI/CD DevOps workflows.',
    description: 'Streamline your operations with auto-scaling multi-cloud architectures, infrastructure as code, and zero-downtime deployment pipelines.',
    architect: 'AWS / Azure Principal Engineer',
    sla: 'Zero Downtime Migration'
  },
  {
    id: 'security',
    title: 'Cybersecurity',
    basePrice: 3000,
    badge: 'Zero-Trust Defense',
    tagline: 'Enterprise threat protection, vulnerability assessments, and compliance.',
    description: 'Safeguard your valuable enterprise data and customer trust with continuous penetration testing, SOC monitoring, and zero-trust access policies.',
    architect: 'Certified CISSP Specialist',
    sla: '< 15 Mins Incident Response'
  },
  {
    id: 'consulting',
    title: 'IT Consulting',
    basePrice: 2000,
    badge: 'Strategic Advisory',
    tagline: 'Expert technology roadmapping and strategic enterprise architecture design.',
    description: 'Align tech investments with strategic business objectives. Our senior architects advise on technology selection, scalable systems, and digital transformation.',
    architect: 'Principal Enterprise Architect',
    sla: 'Strategic Roadmap Guaranteed'
  },
  {
    id: 'data-ai',
    title: 'Data & AI Systems',
    basePrice: 4200,
    badge: 'Enterprise Intelligence',
    tagline: 'Predictive analytics, custom LLM pipelines, and automated intelligence.',
    description: 'Empower decision-making with automated ETL data pipelines, custom machine learning models, and real-time enterprise intelligence dashboards.',
    architect: 'Lead AI & Data Engineer',
    sla: 'Sub-second Inference'
  },
  {
    id: 'support',
    title: '24/7 Managed IT Support',
    basePrice: 1500,
    badge: 'Round-the-Clock',
    tagline: 'Proactive infrastructure monitoring, automated backups, and incident response.',
    description: 'Continuous uptime monitoring, automated failover management, and immediate expert engineering intervention whenever an issue arises.',
    architect: 'SOC Operations Lead',
    sla: '< 5 Mins Critical Response'
  }
];

// Initial Default Add-ons
const DEFAULT_ADDONS = [
  { id: 'compliance', title: 'HIPAA / SOC2 / GDPR Compliance Package', price: 1200, popular: true },
  { id: 'ha', title: 'Multi-Region High Availability & Active-Active Failover', price: 1800, popular: true },
  { id: 'cicd', title: 'Automated CI/CD DevOps Pipeline Deployment', price: 950, popular: false },
  { id: 'pentest', title: 'Full Penetration Testing & Threat Audit', price: 1400, popular: true },
  { id: 'monitoring', title: '24/7 Live SOC Infrastructure Monitoring', price: 750, popular: false }
];

// Initial Default Inquiries
const DEFAULT_INQUIRIES = [
  {
    id: 'LYN-9024',
    name: 'Sarah Vance',
    email: 'sarah.v@aerocloud.com',
    phone: '+1 (415) 892-0192',
    service: 'Cloud Solutions',
    scale: 'Global Enterprise Scale',
    budget: '$15,000 - $25,000',
    status: 'In Review',
    date: '2026-08-04 14:22',
    details: 'Need multi-region AWS EKS architecture migration with automated Kubernetes autoscaling.'
  },
  {
    id: 'LYN-8812',
    name: 'Dr. Michael Chang',
    email: 'mchang@omnihealth.org',
    phone: '+1 (617) 492-3811',
    service: 'Cybersecurity',
    scale: 'Mid-Market Enterprise',
    budget: '$8,000 - $15,000',
    status: 'Accepted',
    date: '2026-08-06 09:15',
    details: 'HIPAA zero-trust vulnerability assessment and patient portal penetration testing.'
  }
];

// Initial Default Users
const DEFAULT_USERS = [
  {
    id: 'USR-1001',
    name: 'Dilneth Madushanka',
    email: 'dilneth@enterprise.io',
    password: 'password123',
    company: 'Lyntrix Global Enterprise',
    birthday: '1998-05-14',
    phone: '+94 71 455 7857',
    country: 'Sri Lanka',
    role: 'Enterprise Client',
    status: 'Active',
    joinedDate: '2026-08-01',
    authProvider: 'Email/Pass'
  },
  {
    id: 'USR-1002',
    name: 'Sarah Vance',
    email: 'sarah.v@aerocloud.com',
    company: 'AeroCloud Systems',
    birthday: '1992-11-20',
    phone: '+1 (415) 892-0192',
    country: 'United States',
    role: 'Enterprise Client',
    status: 'Active',
    joinedDate: '2026-08-04',
    authProvider: 'Google OAuth'
  },
  {
    id: 'USR-1003',
    name: 'Dr. Michael Chang',
    email: 'mchang@omnihealth.org',
    company: 'OmniHealth Global',
    birthday: '1985-03-09',
    phone: '+1 (617) 492-3811',
    country: 'United States',
    role: 'VIP Client',
    status: 'Active',
    joinedDate: '2026-08-06',
    authProvider: 'Google OAuth'
  }
];

// Sanitizers for Cloud Firestore collections
const sanitizeUserForCloud = (u) => ({
  id: u.id,
  name: u.name || 'Valued Client',
  email: (u.email || '').trim().toLowerCase(),
  password: u.password || null,
  company: u.company || 'Corporate Client',
  birthday: u.birthday || '1998-05-14',
  phone: u.phone || 'N/A',
  country: u.country || 'Sri Lanka',
  role: u.role || 'Client',
  status: u.status || 'Active',
  joinedDate: u.joinedDate || new Date().toISOString().split('T')[0],
  authProvider: u.authProvider || 'Email'
});

const sanitizeInquiryForCloud = (inq) => ({
  id: inq.id,
  name: inq.name || 'Valued Client',
  email: (inq.email || '').trim().toLowerCase(),
  phone: inq.phone || 'N/A',
  service: inq.service || 'Software Development',
  scale: inq.scale || 'Enterprise',
  budget: inq.budget || '$5,000 - $10,000',
  status: inq.status || 'New',
  date: inq.date || new Date().toISOString().replace('T', ' ').slice(0, 16),
  details: inq.details || 'N/A',
  consultationStatus: inq.consultationStatus || 'Pending Approval',
  hasConsultation: Boolean(inq.hasConsultation),
  consultationDate: inq.consultationDate || null,
  consultationTime: inq.consultationTime || null,
  meetingPlatform: inq.meetingPlatform || null,
  meetingLink: inq.meetingLink || null
});

const sanitizeAdminForCloud = (a) => ({
  id: a.id,
  name: a.name || 'Admin User',
  email: (a.email || '').trim().toLowerCase(),
  password: a.password || 'admin123',
  role: a.role || 'Master Admin',
  status: a.status || 'Active',
  createdDate: a.createdDate || new Date().toISOString().split('T')[0]
});

// Dispatch cross-component real-time database update event
const notifyDbUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('lyntrix-db-updated'));
  }
};

// Helper to safely merge arrays: baseList loaded first, priorityList values overlay baseList
function mergeDatasets(baseList, priorityList, primaryKey = 'id', fallbackKey = 'email') {
  const items = [];

  const processItem = (item, isPriority) => {
    if (!item) return;
    const pk = item[primaryKey] ? String(item[primaryKey]).trim() : '';
    const fk = (fallbackKey && item[fallbackKey]) ? String(item[fallbackKey]).trim().toLowerCase() : '';
    
    // Match existing item by primary key or fallback key
    let existingIndex = -1;
    if (pk) {
      existingIndex = items.findIndex(i => i && i[primaryKey] && String(i[primaryKey]).trim() === pk);
    }
    if (existingIndex === -1 && fk) {
      existingIndex = items.findIndex(i => i && fallbackKey && i[fallbackKey] && String(i[fallbackKey]).trim().toLowerCase() === fk);
    }

    if (existingIndex !== -1) {
      if (isPriority) {
        items[existingIndex] = { ...items[existingIndex], ...item };
      } else {
        items[existingIndex] = { ...item, ...items[existingIndex] };
      }
    } else {
      items.push({ ...item });
    }
  };

  if (Array.isArray(baseList)) {
    for (const item of baseList) processItem(item, false);
  }
  if (Array.isArray(priorityList)) {
    for (const item of priorityList) processItem(item, true);
  }

  return items;
}

export const db = {
  isCloudConnected: () => isFirebaseConfigured,

  // --- Real-Time Background Synchronization with Cloud Firestore ---
  syncWithCloud: async () => {
    if (!isFirebaseConfigured) return;
    try {
      // 1. Non-destructive Sync for Inquiries
      const localInquiries = db.getInquiries();
      let cloudInquiries = null;
      try {
        cloudInquiries = await cloud.list('inquiries');
      } catch (e) {}

      if (cloudInquiries && cloudInquiries.length > 0) {
        const baseMerged = mergeDatasets(DEFAULT_INQUIRIES, cloudInquiries, 'id');
        const fullyMerged = mergeDatasets(baseMerged, localInquiries, 'id');
        localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(fullyMerged));

        const cloudIds = new Set(cloudInquiries.map(c => c.id));
        const localOnlyInquiries = fullyMerged.filter(l => l && l.id && !cloudIds.has(l.id));
        if (localOnlyInquiries.length > 0) {
          const sanitized = localOnlyInquiries.map(sanitizeInquiryForCloud);
          await cloud.upsert('inquiries', sanitized);
        }
      }

      // 2. Non-destructive Sync for Users
      const localUsers = db.getUsers();
      let cloudUsers = null;
      try {
        cloudUsers = await cloud.list('users');
      } catch (e) {}

      const fetchedCloudUsers = cloudUsers || [];
      const baseMergedUsers = mergeDatasets(DEFAULT_USERS, fetchedCloudUsers, 'id', 'email');
      const fullyMergedUsers = mergeDatasets(baseMergedUsers, localUsers, 'id', 'email');
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(fullyMergedUsers));

      if (fullyMergedUsers.length > 0) {
        const cloudEmails = new Set(fetchedCloudUsers.map(u => u.email?.toLowerCase()));
        const localOnlyUsers = fullyMergedUsers.filter(u => u && u.email && !cloudEmails.has(u.email.toLowerCase()));
        if (localOnlyUsers.length > 0) {
          const sanitized = localOnlyUsers.map(sanitizeUserForCloud);
          await cloud.upsert('users', sanitized);
        }
      }

      // 3. Non-destructive Sync for Admins
      const localAdmins = db.getAdmins();
      let cloudAdmins = null;
      try {
        cloudAdmins = await cloud.list('admins');
      } catch (e) {}

      if (cloudAdmins && cloudAdmins.length > 0) {
        const baseMerged = mergeDatasets(DEFAULT_ADMINS, cloudAdmins, 'id', 'email');
        const fullyMerged = mergeDatasets(baseMerged, localAdmins, 'id', 'email');
        localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(fullyMerged));

        const cloudAdminEmails = new Set(cloudAdmins.map(a => a.email?.toLowerCase()));
        const localOnlyAdmins = fullyMerged.filter(a => a && a.email && !cloudAdminEmails.has(a.email.toLowerCase()));
        if (localOnlyAdmins.length > 0) {
          const sanitized = localOnlyAdmins.map(sanitizeAdminForCloud);
          await cloud.upsert('admins', sanitized);
        }
      }

      // 4. Non-destructive Sync for Services (Cloud DB priority for prices)
      const localServices = db.getServices();
      let cloudServices = null;
      try {
        cloudServices = await cloud.list('services');
      } catch (e) {}

      if (cloudServices && cloudServices.length > 0) {
        const normalizedCloud = cloudServices.map(s => ({
          ...s,
          basePrice: Number(s.basePrice) || 0
        }));
        const baseMerged = mergeDatasets(DEFAULT_SERVICES, localServices, 'id');
        const fullyMerged = mergeDatasets(baseMerged, normalizedCloud, 'id');
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(fullyMerged));
      } else if (localServices.length > 0) {
        await db.saveServices(localServices);
      }

      // 5. Non-destructive Sync for Addons (Cloud DB priority for prices)
      const localAddons = db.getAddons();
      let cloudAddons = null;
      try {
        cloudAddons = await cloud.list('addons');
      } catch (e) {}

      if (cloudAddons && cloudAddons.length > 0) {
        const normalizedCloudAddons = cloudAddons.map(a => ({
          ...a,
          price: Number(a.price) || 0
        }));
        const baseMerged = mergeDatasets(DEFAULT_ADDONS, localAddons, 'id');
        const fullyMerged = mergeDatasets(baseMerged, normalizedCloudAddons, 'id');
        localStorage.setItem(STORAGE_KEYS.ADDONS, JSON.stringify(fullyMerged));
      } else if (localAddons.length > 0) {
        await db.saveAddons(localAddons);
      }

      notifyDbUpdate();
    } catch (e) {
      console.warn('[FIRESTORE SYNC NOTE]:', e.message);
    }
  },

  // --- Services Management ---
  getServices: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
      if (!saved) {
        localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
        return DEFAULT_SERVICES;
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_SERVICES;
      }
      return mergeDatasets(DEFAULT_SERVICES, parsed, 'id');
    } catch (e) {
      return DEFAULT_SERVICES;
    }
  },

  saveServices: async (services) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
      notifyDbUpdate();
      if (isFirebaseConfigured) {
        const payload = services.map(s => ({
          id: s.id,
          title: s.title,
          description: s.description || '',
          basePrice: Number(s.basePrice) || 0,
          badge: s.badge || '',
          tagline: s.tagline || '',
          architect: s.architect || '',
          sla: s.sla || ''
        }));
                await cloud.upsert('services', payload);
      }
    } catch (e) {
      console.warn('[FIRESTORE SERVICES UPSERT NOTE]:', e.message);
    }
  },

  updateServicePrice: async (serviceId, newBasePrice) => {
    const services = db.getServices();
    const updated = services.map(s => {
      if (s.id === serviceId) {
        return { ...s, basePrice: Number(newBasePrice) };
      }
      return s;
    });
    await db.saveServices(updated);
    return updated;
  },

  // --- Addons Management ---
  getAddons: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADDONS);
      if (!saved) {
        localStorage.setItem(STORAGE_KEYS.ADDONS, JSON.stringify(DEFAULT_ADDONS));
        return DEFAULT_ADDONS;
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_ADDONS;
      }
      return mergeDatasets(DEFAULT_ADDONS, parsed, 'id');
    } catch (e) {
      return DEFAULT_ADDONS;
    }
  },

  saveAddons: async (addons) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADDONS, JSON.stringify(addons));
      notifyDbUpdate();
      if (isFirebaseConfigured) {
        const payload = addons.map(a => ({
          id: a.id,
          title: a.title,
          price: Number(a.price) || 0,
          popular: Boolean(a.popular)
        }));
        await cloud.upsert('addons', payload);
      }
    } catch (e) {
      console.warn('[FIRESTORE ADDONS UPSERT NOTE]:', e.message);
    }
  },

  // --- Inquiries / Proposals Management ---
  getInquiries: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      if (!saved) {
        localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(DEFAULT_INQUIRIES));
        return DEFAULT_INQUIRIES;
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_INQUIRIES;
      }
      return mergeDatasets(DEFAULT_INQUIRIES, parsed, 'id');
    } catch (e) {
      return DEFAULT_INQUIRIES;
    }
  },

  saveInquiries: async (inquiries) => {
    try {
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
      notifyDbUpdate();
      if (isFirebaseConfigured) {
        await cloud.upsert('inquiries', inquiries.map(sanitizeInquiryForCloud));
      }
    } catch (e) {
      console.warn('[FIRESTORE INQUIRIES UPSERT NOTE]:', e.message);
    }
  },

  addInquiry: async (newInquiry) => {
    const inquiries = db.getInquiries();
    const filtered = inquiries.filter(item => item.id !== newInquiry.id);
    const updated = [newInquiry, ...filtered];
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(updated));
    notifyDbUpdate();

    if (isFirebaseConfigured) {
      try {
        await cloud.upsert('inquiries', sanitizeInquiryForCloud(newInquiry));
      } catch (err) {
        console.error('[FIRESTORE ADD INQUIRY ERROR]:', err.message);
      }
    }
    return updated;
  },

  updateInquiryStatus: async (inquiryId, newStatus) => {
    const inquiries = db.getInquiries();
    const updated = inquiries.map(item => {
      if (item.id === inquiryId) {
        return { ...item, status: newStatus };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(updated));
    notifyDbUpdate();

    const changed = updated.find(item => item.id === inquiryId);
    if (isFirebaseConfigured && changed) {
      try {
        await cloud.upsert('inquiries', sanitizeInquiryForCloud(changed));
      } catch (e) {
        console.warn('[FIRESTORE INQUIRY STATUS NOTE]:', e.message);
      }
    }
    return updated;
  },

  deleteInquiry: async (inquiryId) => {
    const inquiries = db.getInquiries();
    const updated = inquiries.filter(item => item.id !== inquiryId);
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(updated));
    notifyDbUpdate();

    if (isFirebaseConfigured) {
      try {
        await cloud.remove('inquiries', inquiryId);
      } catch (e) {
        console.warn('[FIRESTORE INQUIRY DELETE NOTE]:', e.message);
      }
    }
    return updated;
  },

  // --- User Management ---
  getUsers: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!saved) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_USERS;
      }
      return mergeDatasets(DEFAULT_USERS, parsed, 'id', 'email');
    } catch (e) {
      return DEFAULT_USERS;
    }
  },

  saveUsers: async (users) => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      notifyDbUpdate();
      if (isFirebaseConfigured) {
        await cloud.upsert('users', users.map(sanitizeUserForCloud));
      }
    } catch (e) {
      console.warn('[FIRESTORE USERS UPSERT NOTE]:', e.message);
    }
  },

  registerUser: async (userData) => {
    const users = db.getUsers();
    const cleanEmail = userData.email.trim().toLowerCase();
    
    // Check if email already exists
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An account with this corporate email already exists.');
    }

    const newUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: userData.name,
      email: cleanEmail,
      password: userData.password || 'password123',
      company: userData.company || 'Corporate Client',
      birthday: userData.birthday || '1998-05-14',
      phone: userData.phone || 'N/A',
      country: userData.country || 'Sri Lanka',
      role: userData.role || 'Client',
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      authProvider: userData.authProvider || 'Email'
    };

    const updated = [newUser, ...users];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    notifyDbUpdate();
    db.setCurrentUser(newUser);

    if (isFirebaseConfigured) {
      try {
        await cloud.upsert('users', sanitizeUserForCloud(newUser));
      } catch (err) {
        console.error('[FIRESTORE REGISTER USER ERROR]:', err.message);
      }
    }

    return newUser;
  },

  loginUser: (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if user is in Admin DB
    const admins = db.getAdmins();
    const foundAdmin = admins.find(a => a.email.toLowerCase() === cleanEmail);
    if (foundAdmin) {
      if (foundAdmin.status === 'Suspended') {
        throw new Error('Account suspended. Please contact Lyntrix Compliance Support.');
      }
      if (foundAdmin.password && password && foundAdmin.password !== password) {
        throw new Error('Incorrect password. Please verify your credentials or reset your password.');
      }
      const adminUser = {
        ...foundAdmin,
        role: foundAdmin.role || 'Master Admin',
        isAdmin: true
      };
      db.setCurrentAdmin(foundAdmin);
      db.setCurrentUser(adminUser);
      return adminUser;
    }

    // 2. Regular User check
    const users = db.getUsers();
    const found = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!found) {
      throw new Error('No account found with this email. Please sign up first.');
    }
    if (found.status === 'Suspended') {
      throw new Error('Account suspended. Please contact Lyntrix Compliance Support.');
    }
    if (found.password && password && found.password !== password) {
      throw new Error('Incorrect password. Please verify your credentials or reset your password.');
    }

    const userRole = (found.role || '').toLowerCase();
    if (userRole.includes('admin') || found.isAdmin) {
      found.isAdmin = true;
      db.setCurrentAdmin(found);
    }

    db.setCurrentUser(found);
    return found;
  },

  updateUserPassword: async (email, newPassword) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check if email belongs to an Admin in Cloud DB
    const admins = db.getAdmins();
    const adminIndex = admins.findIndex(a => a.email.toLowerCase() === cleanEmail);
    if (adminIndex !== -1) {
      admins[adminIndex].password = newPassword;
      await db.saveAdmins(admins);
      return { success: true, type: 'admin', user: admins[adminIndex] };
    }

    // 2. Check if email belongs to a regular Client in Cloud DB
    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      await db.saveUsers(users);
      return { success: true, type: 'client', user: users[userIndex] };
    }

    // If account doesn't exist yet, register new credentials
    const newUser = {
      id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      password: newPassword,
      company: 'Corporate Client',
      role: 'Client',
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      authProvider: 'Email'
    };
    await db.saveUsers([newUser, ...users]);

    return { success: true, type: 'client', user: newUser };
  },

  updateUserProfile: async (updatedData) => {
    const users = db.getUsers();
    const cleanEmail = (updatedData.email || '').trim().toLowerCase();
    const index = users.findIndex(u => u.email?.toLowerCase() === cleanEmail || u.id === updatedData.id);
    let finalUser = updatedData;
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedData };
      finalUser = users[index];
      await db.saveUsers(users);
    }
    db.setCurrentUser(finalUser);

    if (isFirebaseConfigured) {
      try {
        await cloud.upsert('users', sanitizeUserForCloud(finalUser));
      } catch (e) {
        console.warn('[FIRESTORE PROFILE NOTE]:', e.message);
      }
    }

    return finalUser;
  },

  updateUserByAdmin: async (userId, updatedData) => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedData };
      await db.saveUsers(users);
      return users[index];
    }
    return null;
  },

  deleteUser: async (userId) => {
    const users = db.getUsers();
    const updated = users.filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    notifyDbUpdate();

    if (isFirebaseConfigured) {
      try {
        await cloud.remove('users', userId);
      } catch (e) {
        console.warn('[FIRESTORE USER DELETE NOTE]:', e.message);
      }
    }
    return updated;
  },

  resetUserPasswordByAdmin: async (userId, newPassword) => {
    const users = db.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].password = newPassword;
      await db.saveUsers(users);
      return users[index];
    }
    return null;
  },

  googleAuth: async (googleProfile) => {
    const cleanEmail = (googleProfile.email || '').trim().toLowerCase();

    // 1. Check if email belongs to an Admin in Admin DB
    const admins = db.getAdmins();
    const foundAdmin = admins.find(a => a.email.toLowerCase() === cleanEmail);
    if (foundAdmin) {
      const adminUser = {
        ...foundAdmin,
        name: googleProfile.name || foundAdmin.name,
        role: foundAdmin.role || 'Master Admin',
        isAdmin: true
      };
      db.setCurrentAdmin(foundAdmin);
      db.setCurrentUser(adminUser);
      return adminUser;
    }

    // 2. Regular User check / creation
    const users = db.getUsers();
    let found = users.find(u => u.email?.toLowerCase() === cleanEmail);
    
    if (!found) {
      found = {
        id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
        name: googleProfile.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        password: null,
        company: googleProfile.company || 'Google Verified Client',
        birthday: googleProfile.birthday || '1995-01-01',
        phone: googleProfile.phone || '+1 415 555 0199',
        country: 'United States',
        role: 'Client',
        status: 'Active',
        joinedDate: new Date().toISOString().split('T')[0],
        authProvider: 'Google'
      };
      const updated = [found, ...users];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
      notifyDbUpdate();
    } else {
      if (googleProfile.name && found.name !== googleProfile.name) {
        found.name = googleProfile.name;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        notifyDbUpdate();
      }
    }

    const userRole = (found.role || '').toLowerCase();
    if (userRole.includes('admin') || found.isAdmin) {
      found.isAdmin = true;
      db.setCurrentAdmin(found);
    }

    db.setCurrentUser(found);

    // ALWAYS sync and upsert to Cloud Firestore on every Google Auth login
    if (isFirebaseConfigured) {
      try {
        await cloud.upsert('users', sanitizeUserForCloud(found));
      } catch (err) {
        console.error('[FIRESTORE GOOGLE USER UPSERT ERROR]:', err.message);
      }
    }

    return found;
  },

  getCurrentUser: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser: (user) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      notifyDbUpdate();
    } catch (e) {}
  },

  logoutUser: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    notifyDbUpdate();
  },

  // --- Admin DB Management ---
  getAdmins: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ADMINS);
      if (!saved) {
        localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(DEFAULT_ADMINS));
        return DEFAULT_ADMINS;
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return DEFAULT_ADMINS;
      }
      return mergeDatasets(DEFAULT_ADMINS, parsed, 'id', 'email');
    } catch (e) {
      return DEFAULT_ADMINS;
    }
  },

  saveAdmins: async (admins) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
      notifyDbUpdate();
      if (isFirebaseConfigured) {
        await cloud.upsert('admins', admins.map(sanitizeAdminForCloud));
      }
    } catch (e) {
      console.warn('[FIRESTORE ADMINS UPSERT NOTE]:', e.message);
    }
  },

  validateAdminCredentials: (email, password) => {
    const admins = db.getAdmins();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const matched = admins.find(
      a => a.email.toLowerCase() === cleanEmail && a.password === cleanPass && a.status === 'Active'
    );

    if (matched) {
      db.setCurrentAdmin(matched);
      return { success: true, admin: matched };
    }
    return { success: false, admin: null };
  },

  addAdmin: async (adminData) => {
    const admins = db.getAdmins();
    const cleanEmail = adminData.email.trim().toLowerCase();
    const existing = admins.find(a => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An administrator account with this corporate email already exists.');
    }

    const newAdmin = {
      id: `ADM-${Math.floor(100 + Math.random() * 900)}`,
      name: adminData.name,
      email: cleanEmail,
      password: adminData.password,
      role: adminData.role || 'Master Admin',
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0]
    };

    const updated = [newAdmin, ...admins];
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(updated));
    notifyDbUpdate();

    if (isFirebaseConfigured) {
      try {
        await cloud.upsert('admins', sanitizeAdminForCloud(newAdmin));
      } catch (e) {
        console.warn('[FIRESTORE ADD ADMIN NOTE]:', e.message);
      }
    }
    return updated;
  },

  updateAdminPassword: async (adminId, newPassword) => {
    const admins = db.getAdmins();
    const updated = admins.map(a => {
      if (a.id === adminId) {
        return { ...a, password: newPassword };
      }
      return a;
    });
    await db.saveAdmins(updated);
    return updated;
  },

  deleteAdmin: async (adminId) => {
    const admins = db.getAdmins();
    if (admins.length <= 1) {
      throw new Error('Cannot delete the primary root administrator account.');
    }
    const updated = admins.filter(a => a.id !== adminId);
    await db.saveAdmins(updated);

    if (isFirebaseConfigured) {
      try {
        await cloud.remove('admins', adminId);
      } catch (e) {
        console.warn('[FIRESTORE ADMIN DELETE NOTE]:', e.message);
      }
    }
    return updated;
  },

  getCurrentAdmin: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentAdmin: (admin) => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN, JSON.stringify(admin));
    } catch (e) {}
  },

  logoutAdmin: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN);
  },

  getMaintenanceConfig: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
      return saved ? JSON.parse(saved) : DEFAULT_MAINTENANCE;
    } catch (e) {
      return DEFAULT_MAINTENANCE;
    }
  },

  saveMaintenanceConfig: (config) => {
    const updated = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('lyntrix-maintenance-updated'));
    }
    return updated;
  }
};
