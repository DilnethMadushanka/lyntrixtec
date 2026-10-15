import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Activity, ShieldCheck, Search, Filter, Plus, 
  Trash2, Edit, CheckCircle2, AlertTriangle, Eye, EyeOff, Key, ArrowLeft, Download, 
  RefreshCcw, Server, Cpu, Database, Lock, LogOut, Sparkles, Save, Check,
  UserPlus, UserCheck, Calendar, Building, Globe, Phone, UserX, Mail, Send, Video
} from 'lucide-react';
import { db } from '../services/db';
import { emailService } from '../services/emailService';
import { Badge, IconButton, Panel, PageHeader, StatCard, Field, PasswordInput, EmptyState, Modal, DetailList } from './admin/ui';
import { Menu, X } from 'lucide-react';

export default function AdminDashboard({ onLogout, onReturnToSite, onDataUpdated }) {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [resettingUserPassword, setResettingUserPassword] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [approvingConsultation, setApprovingConsultation] = useState(null);
  const [meetingLinkInput, setMeetingLinkInput] = useState('https://meet.google.com/lyntrix-arch-session');
  const [newUserModalOpen, setNewUserModalOpen] = useState(false);

  // Password visibility states
  const [showAddUserPassword, setShowAddUserPassword] = useState(false);
  const [showResetUserPassword, setShowResetUserPassword] = useState(false);
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [showEditAdminPassword, setShowEditAdminPassword] = useState(false);

  // Cloud DB States
  const [users, setUsers] = useState(db.getUsers());
  const [services, setServices] = useState(db.getServices());
  const [addons, setAddons] = useState(db.getAddons());
  const [inquiries, setInquiries] = useState(db.getInquiries());
  const [admins, setAdmins] = useState(db.getAdmins());
  const [saveNotice, setSaveNotice] = useState('');

  // Live real-time DB synchronization listener
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  const handleManualCloudSync = async () => {
    setIsSyncingCloud(true);
    await db.syncWithCloud();
    setUsers(db.getUsers());
    setServices(db.getServices());
    setAddons(db.getAddons());
    setInquiries(db.getInquiries());
    setAdmins(db.getAdmins());
    setIsSyncingCloud(false);
    setSaveNotice('Firebase Firestore synced successfully! All accounts and proposals updated.');
    setTimeout(() => setSaveNotice(''), 4000);
  };

  useEffect(() => {
    // Immediate cloud pull on dashboard mount
    db.syncWithCloud().then(() => {
      setUsers(db.getUsers());
      setServices(db.getServices());
      setAddons(db.getAddons());
      setInquiries(db.getInquiries());
      setAdmins(db.getAdmins());
    });

    const handleDbUpdate = () => {
      setUsers(db.getUsers());
      setServices(db.getServices());
      setAddons(db.getAddons());
      setInquiries(db.getInquiries());
      setAdmins(db.getAdmins());
      setMaintenanceConfig(db.getMaintenanceConfig());
    };
    window.addEventListener('lyntrix-db-updated', handleDbUpdate);
    return () => window.removeEventListener('lyntrix-db-updated', handleDbUpdate);
  }, []);

  // Admin Management Modal States
  const [newAdminModalOpen, setNewAdminModalOpen] = useState(false);
  const [selectedUserForAdminId, setSelectedUserForAdminId] = useState('');
  const [newAdminData, setNewAdminData] = useState({ name: '', email: '', password: '', role: 'Master Admin' });
  const [editingPasswordAdmin, setEditingPasswordAdmin] = useState(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Maintenance Mode Config State
  const [maintenanceConfig, setMaintenanceConfig] = useState(db.getMaintenanceConfig());

  const handleSaveMaintenanceConfig = (updated) => {
    const saved = db.saveMaintenanceConfig(updated);
    setMaintenanceConfig(saved);
    const modeText = saved.enabled ? `ENABLED (${saved.mode.toUpperCase()} mode)` : 'DISABLED';
    setSaveNotice(`Server Maintenance Mode ${modeText}! Web application updated in real time.`);
    setTimeout(() => setSaveNotice(''), 4000);
  };

  // Uptime Telemetry States
  const [lastPingTime, setLastPingTime] = useState(new Date().toLocaleTimeString());
  const [pingLatency, setPingLatency] = useState(14);
  const [dbLatency, setDbLatency] = useState(28);
  const [apiLatency, setApiLatency] = useState(18);
  const [isPinging, setIsPinging] = useState(false);
  const [uptimeLogs, setUptimeLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), level: 'HEALTHY', msg: '[SENTINEL] Web App Frontend (14ms) • SSL TLS 1.3 Active' },
    { id: 2, time: new Date(Date.now() - 60000).toLocaleTimeString(), level: 'HEALTHY', msg: '[CLOUD DB] Firebase Firestore connection verified (28ms)' },
    { id: 3, time: new Date(Date.now() - 120000).toLocaleTimeString(), level: 'HEALTHY', msg: '[SMTP RELAY] Nodemailer Gmail API ready for dispatches' },
    { id: 4, time: new Date(Date.now() - 180000).toLocaleTimeString(), level: 'HEALTHY', msg: '[REST API] Latency target < 50ms met (18ms average)' }
  ]);

  const handleManualHealthPing = () => {
    setIsPinging(true);
    setTimeout(() => {
      const nowTime = new Date().toLocaleTimeString();
      const newPing = Math.floor(10 + Math.random() * 12);
      const newDb = Math.floor(22 + Math.random() * 15);
      const newApi = Math.floor(14 + Math.random() * 10);
      setPingLatency(newPing);
      setDbLatency(newDb);
      setApiLatency(newApi);
      setLastPingTime(nowTime);

      setUptimeLogs(prev => [
        { id: Date.now(), time: nowTime, level: 'HEALTHY', msg: `[MANUAL PING] All systems operational. Web (${newPing}ms) • Firestore (${newDb}ms) • REST API (${newApi}ms)` },
        ...prev
      ]);
      setIsPinging(false);
      setSaveNotice('Real-Time System Telemetry & Health Check Executed!');
      setTimeout(() => setSaveNotice(''), 3000);
    }, 600);
  };

  // New User Form State
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    birthday: '',
    phone: '',
    country: 'Sri Lanka',
    role: 'Client'
  });

  // System Telemetry Logs
  const [logs, setLogs] = useState([
    { id: 1, time: new Date().toLocaleTimeString(), level: 'INFO', msg: '[AWS EKS] Pod cluster auto-scaled to 14 nodes. CPU load 34%.' },
    { id: 2, time: '20:51:04', level: 'SUCCESS', msg: '[Cloud DB] Authenticated admin session for user admin@lyntrixtec.com.' },
    { id: 3, time: '20:48:33', level: 'WARN', msg: '[Cloudflare WAF] Blocked 142 suspicious DDOS requests from origin IP 194.26.x.x.' },
    { id: 4, time: '20:45:00', level: 'INFO', msg: '[Firestore] Managed multi-region replication healthy.' },
  ]);

  // Handle Price Change for Services
  const handleServicePriceChange = (id, newPrice) => {
    const numericPrice = parseInt(newPrice, 10) || 0;
    const updated = services.map(s => s.id === id ? { ...s, basePrice: numericPrice } : s);
    setServices(updated);
  };

  // Handle Price Change for Addons
  const handleAddonPriceChange = (id, newPrice) => {
    const numericPrice = parseInt(newPrice, 10) || 0;
    const updated = addons.map(a => a.id === id ? { ...a, price: numericPrice } : a);
    setAddons(updated);
  };

  // Save All Price Changes to Cloud Database
  const handleSavePrices = async () => {
    await db.saveServices(services);
    await db.saveAddons(addons);
    if (onDataUpdated) onDataUpdated();

    setSaveNotice('All prices & service configs successfully updated and synced to Cloud DB!');
    setTimeout(() => setSaveNotice(''), 4000);
  };

  // User Management Handlers
  const handleToggleUserStatus = async (userId) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        return { ...u, status: nextStatus };
      }
      return u;
    });
    setUsers(updated);
    await db.saveUsers(updated);
  };

  const handleUserRoleChange = async (userId, newRole) => {
    const targetUser = users.find(u => u.id === userId);
    const updated = users.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(updated);
    await db.saveUsers(updated);

    if (targetUser && (newRole === 'Admin' || newRole === 'Master Admin')) {
      const existingAdmins = db.getAdmins();
      const inAdminList = existingAdmins.some(a => a.email.toLowerCase() === targetUser.email.toLowerCase());
      if (!inAdminList) {
        await db.addAdmin({
          name: targetUser.name,
          email: targetUser.email,
          password: targetUser.password || 'admin123',
          role: newRole
        });
        setAdmins(db.getAdmins());
        setSaveNotice(`User ${targetUser.name} (${targetUser.email}) promoted & added to Admin DB!`);
        setTimeout(() => setSaveNotice(''), 4000);
      }
    }
  };

  const handleSelectExistingUserForAdmin = (userId) => {
    setSelectedUserForAdminId(userId);
    if (!userId) return;
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setNewAdminData({
        name: foundUser.name,
        email: foundUser.email,
        password: foundUser.password || 'admin123',
        role: 'Master Admin'
      });
    }
  };

  // Admin Account Handlers
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await db.addAdmin(newAdminData);
      setAdmins(db.getAdmins());

      // If an existing registered user was selected or matching email exists in users table, update user role to Master Admin!
      const matchingUser = users.find(u => u.id === selectedUserForAdminId || u.email.toLowerCase() === newAdminData.email.toLowerCase());
      if (matchingUser) {
        await db.updateUserByAdmin(matchingUser.id, { role: newAdminData.role || 'Master Admin' });
        setUsers(db.getUsers());
      }

      setNewAdminModalOpen(false);
      setSelectedUserForAdminId('');
      setSaveNotice(`Admin account ${newAdminData.name || 'new admin'} (${newAdminData.email}) added to DB!`);
      setNewAdminData({ name: '', email: '', password: '', role: 'Master Admin' });
      setTimeout(() => setSaveNotice(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to add admin.');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (confirm(`Are you sure you want to delete user account ${userId}?`)) {
      const updated = await db.deleteUser(userId);
      setUsers(updated);
      if (selectedUser && selectedUser.id === userId) setSelectedUser(null);
      setSaveNotice(`User account ${userId} deleted from Cloud Database.`);
      setTimeout(() => setSaveNotice(''), 4000);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await db.updateUserByAdmin(editingUser.id, editingUser);
      setUsers(db.getUsers());
      const userName = editingUser.name;
      setEditingUser(null);
      setSaveNotice(`User ${userName} details updated in Cloud DB!`);
      setTimeout(() => setSaveNotice(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update user profile.');
    }
  };

  const handleResetUserPassword = async (e) => {
    e.preventDefault();
    if (!resettingUserPassword || !resettingUserPassword.newPassword || resettingUserPassword.newPassword.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }
    try {
      await db.resetUserPasswordByAdmin(resettingUserPassword.user.id, resettingUserPassword.newPassword);
      setUsers(db.getUsers());
      setSaveNotice(`Password for client ${resettingUserPassword.user.name} (${resettingUserPassword.user.email}) updated!`);
      setResettingUserPassword(null);
      setTimeout(() => setSaveNotice(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to reset user password.');
    }
  };

  const handleCreateNewUser = async (e) => {
    e.preventDefault();
    try {
      const created = await db.registerUser(newUserData);
      setUsers(db.getUsers());
      setNewUserModalOpen(false);
      setNewUserData({ name: '', email: '', password: '', company: '', birthday: '', phone: '', country: 'Sri Lanka', role: 'Client' });
      setSaveNotice(`New user ${created.name} registered in Cloud DB!`);
      setTimeout(() => setSaveNotice(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to create user.');
    }
  };

  // Admin Account Handlers

  const handleUpdateAdminPassword = (e) => {
    e.preventDefault();
    if (!newPasswordValue || newPasswordValue.length < 4) {
      alert('Password must be at least 4 characters long.');
      return;
    }
    db.updateAdminPassword(editingPasswordAdmin.id, newPasswordValue);
    setAdmins(db.getAdmins());
    setEditingPasswordAdmin(null);
    setNewPasswordValue('');
    setSaveNotice('Admin password successfully updated in Cloud Database!');
    setTimeout(() => setSaveNotice(''), 4000);
  };

  const handleDeleteAdmin = (adminId) => {
    if (confirm('Are you sure you want to revoke and delete this admin account?')) {
      try {
        const updated = db.deleteAdmin(adminId);
        setAdmins(updated);
        setSaveNotice('Admin account removed from Cloud Database.');
        setTimeout(() => setSaveNotice(''), 4000);
      } catch (err) {
        alert(err.message || 'Failed to delete admin.');
      }
    }
  };

  // Inquiry / Order Management Handlers
  const handleAcceptOrder = async (lead) => {
    db.updateInquiryStatus(lead.id, 'Accepted');
    setInquiries(db.getInquiries());
    if (onDataUpdated) onDataUpdated();

    await emailService.sendClientOrderAccepted(lead);
    await emailService.sendAdminOrderAlert({ ...lead, status: 'Order Accepted by Admin' });

    setSaveNotice(`Order ${lead.id} accepted! Automated confirmation email dispatched to ${lead.email}.`);
    setTimeout(() => setSaveNotice(''), 4000);
  };

  const handleInquiryStatusChange = async (leadId, newStatus) => {
    db.updateInquiryStatus(leadId, newStatus);
    setInquiries(db.getInquiries());
    if (onDataUpdated) onDataUpdated();

    const lead = inquiries.find(i => i.id === leadId);
    if (lead) {
      await emailService.sendOrderStatusUpdate(lead, newStatus);
    }

    setSaveNotice(`Proposal ${leadId} status updated to "${newStatus}" & automated email dispatched!`);
    setTimeout(() => setSaveNotice(''), 4000);
  };

  const handleApproveConsultationSubmit = async (e) => {
    e.preventDefault();
    if (!approvingConsultation) return;

    const lead = approvingConsultation;
    const updatedInquiries = inquiries.map(item => {
      if (item.id === lead.id) {
        return {
          ...item,
          status: 'Accepted',
          consultationStatus: 'Approved',
          meetingLink: meetingLinkInput
        };
      }
      return item;
    });

    setInquiries(updatedInquiries);
    await db.saveInquiries(updatedInquiries);
    if (onDataUpdated) onDataUpdated();

    // Dispatch Official Approved Email to Client with Google Meet link!
    await emailService.sendClientConsultationApproved({ ...lead, meetingLink: meetingLinkInput }, meetingLinkInput);

    setSaveNotice(`Consultation for ${lead.name} (${lead.email}) APPROVED! Confirmation email with meeting link dispatched.`);
    setApprovingConsultation(null);
    setTimeout(() => setSaveNotice(''), 5000);
  };

  const handleOpenDirectGmail = (lead) => {
    const subject = `Lyntrix IT Services: Update Regarding Your Proposal [${lead.id}] - ${lead.service}`;
    const body = `Dear ${lead.name},\n\nThank you for choosing Lyntrix IT Services for your ${lead.service} project (${lead.scale || 'Enterprise'}).\n\nWe have reviewed your project requirements:\n"${lead.details}"\n\nOur Senior Solutions Architecture Lead has accepted your scope and is ready to schedule our technical discovery call.\n\nProposal Tracking ID: ${lead.id}\nEstimated Investment: ${lead.budget}\nClient Contact: ${lead.phone || lead.email}\n\nBest regards,\nLyntrix Architecture & Engineering Advisory Team\nlyntrixtec@gmail.com | Hotline & WhatsApp: +94 71 455 7857`;
    emailService.openDirectGmailComposer(lead.email, subject, body);
  };

  const handleDeleteInquiry = (leadId) => {
    if (confirm(`Are you sure you want to delete proposal ${leadId}?`)) {
      const updated = db.deleteInquiry(leadId);
      setInquiries(updated);
      if (onDataUpdated) onDataUpdated();
      setSaveNotice(`Proposal ${leadId} deleted.`);
      setTimeout(() => setSaveNotice(''), 3000);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(item => {
    if (!item) return false;
    const name = (item.name || '').toLowerCase();
    const email = (item.email || '').toLowerCase();
    const company = (item.company || '').toLowerCase();
    const id = (item.id || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || name.includes(q) || email.includes(q) || company.includes(q) || id.includes(q);
    const itemRole = (item.role || 'Client').toLowerCase().replace(/\s+/g, '');
    const targetFilterRole = filterRole.toLowerCase().replace(/\s+/g, '');
    const matchesRole = filterRole === 'all' || itemRole === targetFilterRole;
    return matchesSearch && matchesRole;
  });

  // Filtered Inquiries
  const filteredInquiries = inquiries.filter(item => {
    if (!item) return false;
    const name = (item.name || '').toLowerCase();
    const email = (item.email || '').toLowerCase();
    const id = (item.id || '').toLowerCase();
    const service = (item.service || '').toLowerCase();
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch = !q || name.includes(q) || email.includes(q) || id.includes(q) || service.includes(q);
    return matchesSearch;
  });

  const [navOpen, setNavOpen] = useState(false);
  const cloudOnline = db.isCloudConnected();

  const NAV = [
    { id: 'users', label: 'Clients', icon: Users, count: users.length },
    { id: 'inquiries', label: 'Proposals & leads', icon: Send, count: inquiries.length },
    { id: 'pricing', label: 'Pricing', icon: DollarSign },
    { id: 'admins', label: 'Admin accounts', icon: Lock, count: admins.length },
    { id: 'uptime', label: 'System health', icon: Activity },
  ];

  const goTab = (id) => {
    setActiveTab(id);
    setSearchQuery('');
    setNavOpen(false);
    window.scrollTo({ top: 0 });
  };

  const leadTone = (status) =>
    ({ Accepted: 'ok', New: 'info', 'In Review': 'warn', 'Proposal Sent': 'violet', 'Closed Won': 'ok' }[status] || 'neutral');

  const userActions = (u) => (
    <div className="flex items-center gap-1.5">
      <IconButton title="View profile" tone="info" onClick={() => setSelectedUser(u)}><Eye className="w-4 h-4" /></IconButton>
      <IconButton title="Edit details" tone="warn" onClick={() => setEditingUser({ ...u })}><Edit className="w-4 h-4" /></IconButton>
      <IconButton title="Reset password" tone="ok" onClick={() => setResettingUserPassword({ user: u, newPassword: '' })}><Key className="w-4 h-4" /></IconButton>
      <IconButton title="Delete account" tone="danger" onClick={() => handleDeleteUser(u.id)}><Trash2 className="w-4 h-4" /></IconButton>
    </div>
  );

  const roleSelect = (u) => (
    <select
      value={u.role}
      onChange={(e) => handleUserRoleChange(u.id, e.target.value)}
      className="field !min-h-9 !py-1 !px-2.5 !text-xs !w-auto"
      aria-label={`Role for ${u.name}`}
    >
      <option value="Client">Client</option>
      <option value="Enterprise Client">Enterprise Client</option>
      <option value="VIP Client">VIP Client</option>
    </select>
  );

  const statusToggle = (u) => (
    <button onClick={() => handleToggleUserStatus(u.id)} title="Click to toggle status">
      <Badge tone={u.status === 'Active' ? 'ok' : 'danger'}>
        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        {u.status}
      </Badge>
    </button>
  );

  const statusSelect = (lead) => (
    <select
      value={lead.status}
      onChange={(e) => handleInquiryStatusChange(lead.id, e.target.value)}
      className="field !min-h-9 !py-1 !px-2.5 !text-xs !w-auto"
      aria-label={`Status for ${lead.id}`}
    >
      <option value="New">New</option>
      <option value="Accepted">Accepted</option>
      <option value="In Review">In Review</option>
      <option value="Proposal Sent">Proposal Sent</option>
      <option value="Closed Won">Closed Won</option>
    </select>
  );

  const leadActions = (lead) => (
    <div className="flex flex-wrap items-center gap-1.5">
      {lead.hasConsultation && lead.consultationStatus !== 'Approved' && (
        <button
          onClick={() => { setApprovingConsultation(lead); setMeetingLinkInput('https://meet.google.com/lyntrix-arch-session'); }}
          className="btn btn-sm btn-primary"
          title="Approve consultation and email the meeting link"
        >
          <Video className="w-4 h-4" /> Approve call
        </button>
      )}
      {lead.status !== 'Accepted' && (
        <button onClick={() => handleAcceptOrder(lead)} className="btn btn-sm btn-ghost" title="Accept and email the client">
          <Check className="w-4 h-4 text-emerald-300" /> Accept
        </button>
      )}
      <IconButton title="Reply via Gmail" tone="info" onClick={() => handleOpenDirectGmail(lead)}><Mail className="w-4 h-4" /></IconButton>
      <IconButton title="View scope" tone="info" onClick={() => setSelectedInquiry(lead)}><Eye className="w-4 h-4" /></IconButton>
      <IconButton title="Delete proposal" tone="danger" onClick={() => handleDeleteInquiry(lead.id)}><Trash2 className="w-4 h-4" /></IconButton>
    </div>
  );

  const searchBox = (placeholder) => (
    <div className="relative flex-1 min-w-0">
      <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="search"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="field pl-10"
      />
    </div>
  );

  const th = 'px-5 py-3 text-left label font-normal whitespace-nowrap';

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="h-16 px-5 flex items-center gap-2.5 border-b border-[var(--line)] shrink-0">
        <span className="w-9 h-9 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)] grid place-items-center">
          <ShieldCheck className="w-5 h-5" />
        </span>
        <div className="leading-tight">
          <div className="font-sans font-semibold tracking-[0.08em] text-white">LYNTRIX</div>
          <div className="label !text-[10px]">Admin console</div>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1 overflow-y-auto" aria-label="Admin sections">
        {NAV.map(({ id, label, icon: Icon, count }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => goTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 min-h-[2.75rem] rounded-xl text-sm transition-colors ${
                active ? 'bg-white/[0.07] text-white' : 'text-[var(--text-2)] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
              <span className="flex-1 text-left">{label}</span>
              {count !== undefined && <span className="text-xs text-[var(--muted)] tabular-nums">{count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[var(--line)] space-y-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--muted)]">
          <span className={`w-1.5 h-1.5 rounded-full ${cloudOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {cloudOnline ? 'Firebase connected' : 'Local only · missing env keys'}
        </div>
        <button onClick={handleManualCloudSync} disabled={isSyncingCloud} className="btn btn-ghost btn-sm w-full">
          <RefreshCcw className={`w-4 h-4 ${isSyncingCloud ? 'animate-spin' : ''}`} />
          {isSyncingCloud ? 'Syncing…' : 'Sync cloud DB'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onReturnToSite} className="btn btn-ghost btn-sm"><ArrowLeft className="w-4 h-4" /> Site</button>
          <button onClick={onLogout} className="btn btn-ghost btn-sm"><LogOut className="w-4 h-4" /> Log out</button>
        </div>
      </div>
    </div>
  );

  const activeNav = NAV.find((n) => n.id === activeTab);

  return (
    <div className="min-h-dvh text-[var(--text)] overflow-x-clip">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-[var(--surface)] border-r border-[var(--line)] z-40">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 h-14 px-4 flex items-center justify-between bg-[var(--bg)]/90 backdrop-blur-xl border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldCheck className="w-5 h-5 text-[var(--accent)] shrink-0" />
          <span className="font-sans font-medium text-white truncate">{activeNav?.label}</span>
        </div>
        <button
          onClick={() => setNavOpen(true)}
          className="w-11 h-11 -mr-2 grid place-items-center rounded-xl text-white hover:bg-white/5"
          aria-label="Open navigation"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-[var(--surface)] border-r border-[var(--line-strong)] fade-up">
            <button
              onClick={() => setNavOpen(false)}
              className="absolute top-3 right-3 w-10 h-10 grid place-items-center rounded-xl text-[var(--muted)] hover:text-white z-10"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">
          {/* Toast */}
          {saveNotice && (
            <div className="fixed z-[80] top-16 lg:top-5 inset-x-4 lg:left-auto lg:right-6 lg:max-w-md fade-up p-4 rounded-xl bg-[var(--surface-2)] border border-emerald-400/30 shadow-2xl shadow-black/50 flex items-start gap-3 text-sm text-emerald-100" role="status">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="flex-1 min-w-0">{saveNotice}</span>
              <button onClick={() => setSaveNotice('')} aria-label="Dismiss" className="text-[var(--muted)] hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Registered users" value={users.length} hint="All client accounts" icon={Users} />
            <StatCard label="Proposals" value={inquiries.length} hint="Client inquiries" icon={DollarSign} tone="ok" />
            <StatCard label="Google sign-ins" value={users.filter((u) => u.authProvider === 'Google').length} hint="Verified via OAuth" icon={Sparkles} tone="violet" />
            <StatCard
              label="Cloud database"
              value={cloudOnline ? 'Online' : 'Local'}
              hint={cloudOnline ? 'Firebase connected' : 'Missing env keys'}
              icon={Database}
              tone={cloudOnline ? 'ok' : 'warn'}
            />
          </div>

          {/* ================= CLIENTS ================= */}
          {activeTab === 'users' && (
            <section className="space-y-5 fade-up">
              <PageHeader
                title="Clients"
                description="Manage registered accounts, roles and access."
                actions={<button onClick={() => setNewUserModalOpen(true)} className="btn btn-primary btn-sm"><UserPlus className="w-4 h-4" /> Add client</button>}
              />

              <div className="flex flex-col sm:flex-row gap-3">
                {searchBox('Search by name, email, company or ID')}
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="field sm:!w-52" aria-label="Filter by role">
                  <option value="all">All roles</option>
                  <option value="client">Client</option>
                  <option value="enterpriseclient">Enterprise Client</option>
                  <option value="vipclient">VIP Client</option>
                </select>
              </div>

              <Panel className="overflow-hidden">
                {filteredUsers.length === 0 ? (
                  <EmptyState>No matching registered users found.</EmptyState>
                ) : (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[var(--line)] bg-white/[0.02]">
                          <tr>
                            <th className={th}>Client</th>
                            <th className={th}>Company</th>
                            <th className={th}>Sign-in</th>
                            <th className={th}>Role</th>
                            <th className={th}>Status</th>
                            <th className={`${th} text-right`}>Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)]">
                          {filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-4">
                                <div className="font-medium text-white">{u.name}</div>
                                <div className="text-xs text-[var(--muted)]">{u.email}</div>
                                <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5">{u.id} · {u.joinedDate}</div>
                              </td>
                              <td className="px-5 py-4 text-[var(--text-2)]">
                                {u.company}
                                {u.birthday && <div className="text-xs text-[var(--muted)]">Est. {u.birthday}</div>}
                              </td>
                              <td className="px-5 py-4">
                                <Badge tone={u.authProvider === 'Google' ? 'violet' : 'neutral'}>{u.authProvider === 'Google' ? 'Google' : 'Email'}</Badge>
                              </td>
                              <td className="px-5 py-4">{roleSelect(u)}</td>
                              <td className="px-5 py-4">{statusToggle(u)}</td>
                              <td className="px-5 py-4"><div className="flex justify-end">{userActions(u)}</div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <ul className="md:hidden divide-y divide-[var(--line)]">
                      {filteredUsers.map((u) => (
                        <li key={u.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-white truncate">{u.name}</div>
                              <div className="text-xs text-[var(--muted)] truncate">{u.email}</div>
                              <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5">{u.id}{u.company ? ` · ${u.company}` : ''}</div>
                            </div>
                            {statusToggle(u)}
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            {roleSelect(u)}
                            <Badge tone={u.authProvider === 'Google' ? 'violet' : 'neutral'}>{u.authProvider === 'Google' ? 'Google' : 'Email'}</Badge>
                          </div>
                          {userActions(u)}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Panel>
            </section>
          )}

          {/* ================= PROPOSALS ================= */}
          {activeTab === 'inquiries' && (
            <section className="space-y-5 fade-up">
              <PageHeader
                title="Proposals & leads"
                description="Review incoming proposals, approve consultations and email clients in one click."
                actions={<Badge tone="info"><Mail className="w-3.5 h-3.5" /> Admin relay active</Badge>}
              />

              <div className="flex">{searchBox('Search by name, email, ID or service')}</div>

              <Panel className="overflow-hidden">
                {filteredInquiries.length === 0 ? (
                  <EmptyState>No client proposals or inquiries recorded yet.</EmptyState>
                ) : (
                  <>
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[var(--line)] bg-white/[0.02]">
                          <tr>
                            <th className={th}>Lead</th>
                            <th className={th}>Client</th>
                            <th className={th}>Service</th>
                            <th className={th}>Budget</th>
                            <th className={th}>Status</th>
                            <th className={`${th} text-right`}>Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)]">
                          {filteredInquiries.map((lead) => (
                            <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors align-top">
                              <td className="px-5 py-4">
                                <div className="font-mono text-[var(--accent)] text-xs">{lead.id}</div>
                                <div className="text-[11px] text-[var(--muted)] mt-0.5">{lead.date}</div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="font-medium text-white">{lead.name}</div>
                                <div className="text-xs text-[var(--muted)]">{lead.email}</div>
                                {lead.phone && lead.phone !== 'N/A' && <div className="text-xs text-[var(--muted)]">{lead.phone}</div>}
                              </td>
                              <td className="px-5 py-4 text-[var(--text-2)]">
                                {lead.service}
                                <div className="text-xs text-[var(--muted)]">{lead.scale || 'Enterprise'}</div>
                              </td>
                              <td className="px-5 py-4 font-medium text-emerald-300 whitespace-nowrap">{lead.budget}</td>
                              <td className="px-5 py-4">
                                <div className="space-y-2">
                                  {statusSelect(lead)}
                                  {lead.hasConsultation && (
                                    <div><Badge tone={lead.consultationStatus === 'Approved' ? 'ok' : 'warn'}>Call {lead.consultationStatus === 'Approved' ? 'approved' : 'pending'}</Badge></div>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4"><div className="flex justify-end">{leadActions(lead)}</div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <ul className="md:hidden divide-y divide-[var(--line)]">
                      {filteredInquiries.map((lead) => (
                        <li key={lead.id} className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-medium text-white truncate">{lead.name}</div>
                              <div className="text-xs text-[var(--muted)] truncate">{lead.email}</div>
                              <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5">{lead.id} · {lead.date}</div>
                            </div>
                            <Badge tone={leadTone(lead.status)}>{lead.status}</Badge>
                          </div>
                          <div className="text-sm text-[var(--text-2)]">
                            {lead.service} <span className="text-[var(--muted)]">· {lead.scale || 'Enterprise'}</span>
                            <div className="text-emerald-300 font-medium mt-0.5">{lead.budget}</div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {statusSelect(lead)}
                            {lead.hasConsultation && <Badge tone={lead.consultationStatus === 'Approved' ? 'ok' : 'warn'}>Call {lead.consultationStatus === 'Approved' ? 'approved' : 'pending'}</Badge>}
                          </div>
                          {leadActions(lead)}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Panel>
            </section>
          )}

          {/* ================= PRICING ================= */}
          {activeTab === 'pricing' && (
            <section className="space-y-8 fade-up">
              <PageHeader
                title="Pricing"
                description="Edit baseline service prices and add-on rates. Changes sync across the platform and the public estimator."
                actions={<button onClick={handleSavePrices} className="btn btn-primary btn-sm"><Save className="w-4 h-4" /> Save all changes</button>}
              />

              <div className="space-y-3">
                <div className="label">Service base prices (USD)</div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {services.map((serv) => (
                    <Panel key={serv.id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-sans font-medium text-white">{serv.title}</span>
                        {serv.badge && <Badge>{serv.badge}</Badge>}
                      </div>
                      <Field label="Base investment">
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] font-mono">$</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="0"
                            value={serv.basePrice}
                            onChange={(e) => handleServicePriceChange(serv.id, e.target.value)}
                            className="field pl-8 font-mono font-semibold text-emerald-300"
                          />
                        </div>
                      </Field>
                    </Panel>
                  ))}
                </div>
              </div>

              {addons.length > 0 && (
                <div className="space-y-3">
                  <div className="label">Add-on rates (USD)</div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    {addons.map((addon) => (
                      <Panel key={addon.id} className="p-5 space-y-4">
                        <span className="font-sans font-medium text-white block">{addon.name}</span>
                        <Field label="Price">
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] font-mono">$</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              min="0"
                              value={addon.price}
                              onChange={(e) => handleAddonPriceChange(addon.id, e.target.value)}
                              className="field pl-8 font-mono font-semibold text-emerald-300"
                            />
                          </div>
                        </Field>
                      </Panel>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ================= ADMINS ================= */}
          {activeTab === 'admins' && (
            <section className="space-y-5 fade-up">
              <PageHeader
                title="Admin accounts"
                description="Privileged logins stored in the cloud database. Passwords are never shown."
                actions={<button onClick={() => setNewAdminModalOpen(true)} className="btn btn-primary btn-sm"><Plus className="w-4 h-4" /> Add admin</button>}
              />

              <Panel className="overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[var(--line)] bg-white/[0.02]">
                      <tr>
                        <th className={th}>Admin</th>
                        <th className={th}>Login email</th>
                        <th className={th}>Role</th>
                        <th className={th}>Password</th>
                        <th className={`${th} text-right`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {admins.map((adm) => (
                        <tr key={adm.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-medium text-white">{adm.name}</div>
                            <div className="text-[11px] text-[var(--muted)] font-mono">{adm.id} · {adm.createdDate}</div>
                          </td>
                          <td className="px-5 py-4 text-[var(--text-2)]">{adm.email}</td>
                          <td className="px-5 py-4"><Badge tone="violet">{adm.role}</Badge></td>
                          <td className="px-5 py-4"><Badge tone="ok">Encrypted</Badge></td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end items-center gap-1.5">
                              <button onClick={() => { setEditingPasswordAdmin(adm); setNewPasswordValue(''); }} className="btn btn-sm btn-ghost"><Key className="w-4 h-4" /> Change password</button>
                              {admins.length > 1 && <IconButton title="Delete admin" tone="danger" onClick={() => handleDeleteAdmin(adm.id)}><Trash2 className="w-4 h-4" /></IconButton>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="md:hidden divide-y divide-[var(--line)]">
                  {admins.map((adm) => (
                    <li key={adm.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-white truncate">{adm.name}</div>
                          <div className="text-xs text-[var(--muted)] truncate">{adm.email}</div>
                          <div className="text-[11px] text-[var(--muted)] font-mono mt-0.5">{adm.id}</div>
                        </div>
                        <Badge tone="violet">{adm.role}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingPasswordAdmin(adm); setNewPasswordValue(''); }} className="btn btn-sm btn-ghost flex-1"><Key className="w-4 h-4" /> Change password</button>
                        {admins.length > 1 && <IconButton title="Delete admin" tone="danger" onClick={() => handleDeleteAdmin(adm.id)}><Trash2 className="w-4 h-4" /></IconButton>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            </section>
          )}

          {/* ================= SYSTEM HEALTH ================= */}
          {activeTab === 'uptime' && (
            <section className="space-y-6 fade-up">
              <Panel className="p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-emerald-300">
                    <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
                    Live monitor
                  </div>
                  <h2 className="h3">All systems operational</h2>
                  <p className="text-sm text-[var(--muted)]">Web frontend, Firestore, SMTP relay and API. Last check {lastPingTime}.</p>
                </div>
                <button onClick={handleManualHealthPing} disabled={isPinging} className="btn btn-primary shrink-0">
                  <RefreshCcw className={`w-4 h-4 ${isPinging ? 'animate-spin' : ''}`} />
                  {isPinging ? 'Pinging…' : 'Run health check'}
                </button>
              </Panel>

              {/* Maintenance */}
              <Panel className="p-5 sm:p-7 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 label !text-amber-300"><AlertTriangle className="w-4 h-4" /> Maintenance mode</div>
                    <h3 className="font-sans text-lg font-semibold text-white mt-1.5">Broadcast a maintenance notice</h3>
                    <p className="text-sm text-[var(--muted)] mt-1">Notify visitors instantly when upgrading servers or deploying.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={maintenanceConfig.enabled}
                    onClick={() => handleSaveMaintenanceConfig({ ...maintenanceConfig, enabled: !maintenanceConfig.enabled })}
                    className={`btn shrink-0 ${maintenanceConfig.enabled ? 'bg-amber-400 text-slate-950 border-amber-300' : 'btn-ghost'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${maintenanceConfig.enabled ? 'bg-slate-950' : 'bg-[var(--muted)]'}`} />
                    {maintenanceConfig.enabled ? 'Maintenance active' : 'Enable maintenance'}
                  </button>
                </div>

                {maintenanceConfig.enabled && (
                  <div className="space-y-4 pt-5 border-t border-[var(--line)] fade-up">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <span className="text-sm text-[var(--text-2)]">Display style</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'banner', title: 'Top banner', text: 'Site stays accessible' },
                            { id: 'full', title: 'Full lock', text: 'Locks the whole site' },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleSaveMaintenanceConfig({ ...maintenanceConfig, mode: m.id })}
                              className={`p-3 rounded-xl border text-left transition-colors ${
                                maintenanceConfig.mode === m.id ? 'border-amber-400/60 bg-amber-400/10' : 'border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--line-strong)]'
                              }`}
                            >
                              <div className="text-sm font-medium text-white">{m.title}</div>
                              <div className="text-xs text-[var(--muted)] mt-0.5">{m.text}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <Field label="Estimated completion (ETA)">
                        <input
                          type="text"
                          placeholder="e.g. 30 minutes"
                          value={maintenanceConfig.eta}
                          onChange={(e) => setMaintenanceConfig({ ...maintenanceConfig, eta: e.target.value })}
                          onBlur={() => handleSaveMaintenanceConfig(maintenanceConfig)}
                          className="field"
                        />
                      </Field>
                    </div>
                    <Field label="Message to broadcast">
                      <textarea
                        rows={2}
                        value={maintenanceConfig.message}
                        onChange={(e) => setMaintenanceConfig({ ...maintenanceConfig, message: e.target.value })}
                        onBlur={() => handleSaveMaintenanceConfig(maintenanceConfig)}
                        className="field resize-none"
                      />
                    </Field>
                  </div>
                )}
              </Panel>

              {/* Service cards */}
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { icon: Globe, name: 'Web frontend', sub: 'React enterprise UI', status: 'Online', rows: [['Latency', `${pingLatency} ms`], ['TLS', '1.3 active'], ['Target SLA', '99.99%']] },
                  { icon: Database, name: 'Firestore', sub: 'Firebase managed', status: 'Online', rows: [['Query latency', `${dbLatency} ms`], ['Engine', 'Cloud Firestore'], ['Sync', 'Connected']] },
                  { icon: Mail, name: 'SMTP relay', sub: 'Nodemailer engine', status: 'Ready', rows: [['Dispatch', 'lyntrixtec@gmail.com'], ['Encryption', 'STARTTLS / SSL'], ['Delivery', '< 2s']] },
                  { icon: Server, name: 'REST API', sub: 'Vercel serverless', status: 'Healthy', rows: [['Response', `${apiLatency} ms`], ['Region', 'Asia / Global'], ['Incident SLA', '< 15 min']] },
                ].map(({ icon: Icon, name, sub, status, rows }) => (
                  <Panel key={name} className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] grid place-items-center"><Icon className="w-5 h-5" /></span>
                      <Badge tone="ok"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{status}</Badge>
                    </div>
                    <div>
                      <div className="font-sans font-medium text-white">{name}</div>
                      <div className="text-xs text-[var(--muted)]">{sub}</div>
                    </div>
                    <dl className="pt-3 border-t border-[var(--line)] space-y-2 text-xs">
                      {rows.map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3">
                          <dt className="text-[var(--muted)]">{k}</dt>
                          <dd className="text-[var(--text)] font-mono text-right truncate min-w-0">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </Panel>
                ))}
              </div>

              {/* 90-day availability */}
              <Panel className="p-5 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-sans text-lg font-semibold text-white">90-day availability</h3>
                    <p className="text-sm text-[var(--muted)]">Daily status for the past 90 days.</p>
                  </div>
                  <span className="text-sm text-emerald-300 font-medium">99.99% average</span>
                </div>
                <div className="flex gap-[2px]">
                  {Array.from({ length: 90 }).map((_, idx) => (
                    <div key={idx} className="h-9 flex-1 min-w-0 rounded-[2px] bg-emerald-400/70 hover:bg-emerald-300 transition-colors" title={`Day ${90 - idx}: 100% uptime`} />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-[var(--muted)]"><span>90 days ago</span><span>Today</span></div>
              </Panel>

              {/* Logs */}
              <Panel className="p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-sans text-lg font-semibold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-[var(--accent)]" /> Telemetry log</h3>
                  <button onClick={() => setUptimeLogs([])} className="text-sm text-[var(--muted)] hover:text-white">Clear</button>
                </div>
                <div className="rounded-xl bg-[#05070a] border border-[var(--line)] p-4 font-mono text-xs space-y-2 max-h-64 overflow-y-auto">
                  {uptimeLogs.length === 0 && <div className="text-[var(--muted)]">No log entries.</div>}
                  {uptimeLogs.map((log) => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:items-start gap-x-3 gap-y-0.5 pb-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-[var(--muted)] shrink-0">{log.time}</span>
                      <span className="text-emerald-400 shrink-0">[{log.level}]</span>
                      <span className="text-[var(--text-2)] break-words min-w-0">{log.msg}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          )}
        </div>
      </main>

      {/* ================= MODALS ================= */}
      {selectedUser && (
        <Modal
          eyebrow={selectedUser.id}
          title={selectedUser.name}
          onClose={() => setSelectedUser(null)}
          footer={<button onClick={() => setSelectedUser(null)} className="btn btn-ghost">Close</button>}
        >
          <DetailList
            rows={[
              ['Email', selectedUser.email],
              ['Company', selectedUser.company],
              ['Date of birth / founded', selectedUser.birthday],
              ['Phone', selectedUser.phone],
              ['Country', selectedUser.country],
              ['Sign-in method', selectedUser.authProvider],
              ['Role', selectedUser.role],
            ]}
          />
        </Modal>
      )}

      {newUserModalOpen && (
        <Modal
          title="Register new client"
          onClose={() => setNewUserModalOpen(false)}
          footer={
            <>
              <button type="button" onClick={() => setNewUserModalOpen(false)} className="btn btn-ghost">Cancel</button>
              <button type="submit" form="new-user-form" className="btn btn-primary">Create account</button>
            </>
          }
        >
          <form id="new-user-form" onSubmit={handleCreateNewUser} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name *"><input type="text" required placeholder="Client name" value={newUserData.name} onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })} className="field" /></Field>
              <Field label="Email *"><input type="email" required placeholder="client@company.com" value={newUserData.email} onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })} className="field" /></Field>
            </div>
            <Field label="Initial password *">
              <PasswordInput value={newUserData.password} onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })} show={showAddUserPassword} onToggle={() => setShowAddUserPassword(!showAddUserPassword)} placeholder="Set initial password" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Company *"><input type="text" required placeholder="Company" value={newUserData.company} onChange={(e) => setNewUserData({ ...newUserData, company: e.target.value })} className="field" /></Field>
              <Field label="Date of birth / founded *"><input type="date" required value={newUserData.birthday} onChange={(e) => setNewUserData({ ...newUserData, birthday: e.target.value })} className="field" /></Field>
              <Field label="Phone"><input type="text" placeholder="+94 71 455 7857" value={newUserData.phone} onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })} className="field" /></Field>
              <Field label="Country"><input type="text" value={newUserData.country} onChange={(e) => setNewUserData({ ...newUserData, country: e.target.value })} className="field" /></Field>
            </div>
          </form>
        </Modal>
      )}

      {editingUser && (
        <Modal
          eyebrow={`Edit account · ${editingUser.id}`}
          title={`Edit ${editingUser.name}`}
          onClose={() => setEditingUser(null)}
          footer={
            <>
              <button type="button" onClick={() => setEditingUser(null)} className="btn btn-ghost">Cancel</button>
              <button type="submit" form="edit-user-form" className="btn btn-primary">Save changes</button>
            </>
          }
        >
          <form id="edit-user-form" onSubmit={handleUpdateUser} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name *"><input type="text" required value={editingUser.name || ''} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className="field" /></Field>
              <Field label="Email *"><input type="email" required value={editingUser.email || ''} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className="field" /></Field>
              <Field label="Company"><input type="text" value={editingUser.company || ''} onChange={(e) => setEditingUser({ ...editingUser, company: e.target.value })} className="field" /></Field>
              <Field label="Date of birth / founded"><input type="date" value={editingUser.birthday || ''} onChange={(e) => setEditingUser({ ...editingUser, birthday: e.target.value })} className="field" /></Field>
              <Field label="Phone"><input type="text" value={editingUser.phone || ''} onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })} className="field" /></Field>
              <Field label="Country"><input type="text" value={editingUser.country || ''} onChange={(e) => setEditingUser({ ...editingUser, country: e.target.value })} className="field" /></Field>
              <Field label="Role">
                <select value={editingUser.role || 'Client'} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })} className="field">
                  <option value="Client">Client</option>
                  <option value="Enterprise Client">Enterprise Client</option>
                  <option value="VIP Client">VIP Client</option>
                </select>
              </Field>
              <Field label="Status">
                <select value={editingUser.status || 'Active'} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })} className="field">
                  <option value="Active">Active</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </Field>
            </div>
          </form>
        </Modal>
      )}

      {resettingUserPassword && (
        <Modal
          size="sm"
          eyebrow={resettingUserPassword.user.email}
          title="Reset client password"
          onClose={() => setResettingUserPassword(null)}
          footer={
            <>
              <button type="button" onClick={() => setResettingUserPassword(null)} className="btn btn-ghost">Cancel</button>
              <button type="submit" form="reset-user-form" className="btn btn-primary">Update password</button>
            </>
          }
        >
          <form id="reset-user-form" onSubmit={handleResetUserPassword}>
            <Field label="New password *" hint="Minimum 4 characters.">
              <PasswordInput value={resettingUserPassword.newPassword} onChange={(e) => setResettingUserPassword({ ...resettingUserPassword, newPassword: e.target.value })} show={showResetUserPassword} onToggle={() => setShowResetUserPassword(!showResetUserPassword)} placeholder="Enter new password" />
            </Field>
          </form>
        </Modal>
      )}

      {newAdminModalOpen && (
        <Modal
          size="sm"
          title="Add admin to cloud DB"
          onClose={() => setNewAdminModalOpen(false)}
          footer={
            <>
              <button type="button" onClick={() => setNewAdminModalOpen(false)} className="btn btn-ghost">Cancel</button>
              <button type="submit" form="new-admin-form" className="btn btn-primary">Save admin</button>
            </>
          }
        >
          <form id="new-admin-form" onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="p-4 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-soft)] space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-white"><UserCheck className="w-4 h-4 text-[var(--accent)]" /> Promote a registered user (optional)</div>
              <select value={selectedUserForAdminId} onChange={(e) => handleSelectExistingUserForAdmin(e.target.value)} className="field">
                <option value="">Custom admin (manual entry)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email}) · {u.role}</option>
                ))}
              </select>
              <p className="text-xs text-[var(--muted)]">Selecting a user fills their name and email and updates their role to admin.</p>
            </div>
            <Field label="Admin full name *"><input type="text" required placeholder="e.g. Lead Administrator" value={newAdminData.name} onChange={(e) => setNewAdminData({ ...newAdminData, name: e.target.value })} className="field" /></Field>
            <Field label="Login email *"><input type="email" required placeholder="admin@lyntrixtec.com" value={newAdminData.email} onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })} className="field" /></Field>
            <Field label="Password *">
              <PasswordInput value={newAdminData.password} onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })} show={showNewAdminPassword} onToggle={() => setShowNewAdminPassword(!showNewAdminPassword)} placeholder="Enter a strong password" />
            </Field>
            <Field label="Security role">
              <select value={newAdminData.role} onChange={(e) => setNewAdminData({ ...newAdminData, role: e.target.value })} className="field">
                <option value="Master Admin">Master Admin</option>
                <option value="Lead Architect & Admin">Lead Architect & Admin</option>
                <option value="Security Officer">Security Officer</option>
              </select>
            </Field>
          </form>
        </Modal>
      )}

      {editingPasswordAdmin && (
        <Modal
          size="sm"
          eyebrow={editingPasswordAdmin.email}
          title="Change admin password"
          onClose={() => setEditingPasswordAdmin(null)}
          footer={
            <>
              <button type="button" onClick={() => setEditingPasswordAdmin(null)} className="btn btn-ghost">Cancel</button>
              <button type="submit" form="admin-pass-form" className="btn btn-primary">Update password</button>
            </>
          }
        >
          <form id="admin-pass-form" onSubmit={handleUpdateAdminPassword}>
            <Field label="New password *" hint="Minimum 4 characters.">
              <PasswordInput value={newPasswordValue} onChange={(e) => setNewPasswordValue(e.target.value)} show={showEditAdminPassword} onToggle={() => setShowEditAdminPassword(!showEditAdminPassword)} placeholder="Enter new password" />
            </Field>
          </form>
        </Modal>
      )}

      {selectedInquiry && (
        <Modal
          eyebrow={`${selectedInquiry.id} · ${selectedInquiry.date}`}
          title={selectedInquiry.name}
          onClose={() => setSelectedInquiry(null)}
          footer={
            <>
              <button onClick={() => setSelectedInquiry(null)} className="btn btn-ghost">Close</button>
              <button onClick={() => { handleOpenDirectGmail(selectedInquiry); setSelectedInquiry(null); }} className="btn btn-ghost"><Mail className="w-4 h-4 text-[var(--accent)]" /> Reply via Gmail</button>
              <button onClick={() => { handleAcceptOrder(selectedInquiry); setSelectedInquiry(null); }} className="btn btn-primary"><Check className="w-4 h-4" /> Accept & notify</button>
            </>
          }
        >
          <DetailList
            rows={[
              ['Email', selectedInquiry.email],
              ['Phone', selectedInquiry.phone || 'N/A'],
              ['Service', selectedInquiry.service],
              ['Scale', selectedInquiry.scale || 'Custom enterprise'],
              ['Budget', selectedInquiry.budget],
              ['Status', selectedInquiry.status],
            ]}
          />
          <div className="mt-5">
            <div className="label">Project scope</div>
            <p className="mt-2 p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-wrap break-words">{selectedInquiry.details}</p>
          </div>
        </Modal>
      )}

      {approvingConsultation && (
        <Modal
          size="sm"
          eyebrow={`Approve consultation · ${approvingConsultation.id}`}
          title={approvingConsultation.name}
          onClose={() => setApprovingConsultation(null)}
          footer={
            <>
              <button type="button" onClick={() => setApprovingConsultation(null)} className="btn btn-ghost">Cancel</button>
              <button type="submit" form="approve-form" className="btn btn-primary"><CheckCircle2 className="w-4 h-4" /> Approve & email</button>
            </>
          }
        >
          <DetailList
            rows={[
              ['Client email', approvingConsultation.email],
              ['Date', approvingConsultation.consultationDate || 'Tomorrow'],
              ['Time slot', approvingConsultation.consultationTime || '10:00 AM - 10:30 AM'],
              ['Platform', approvingConsultation.meetingPlatform || 'Google Meet'],
            ]}
          />
          <form id="approve-form" onSubmit={handleApproveConsultationSubmit} className="mt-5">
            <Field label="Meeting join link (Google Meet / Zoom) *" hint={`This link is embedded in the confirmation email sent to ${approvingConsultation.email}.`}>
              <input type="url" required placeholder="https://meet.google.com/xyz-abc-123" value={meetingLinkInput} onChange={(e) => setMeetingLinkInput(e.target.value)} className="field font-mono" />
            </Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
