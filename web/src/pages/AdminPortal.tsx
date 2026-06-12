import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { 
  Lock, Mail, Link2, Trash2, LogOut, 
  Settings, Users, Check, AlertCircle, Layers 
} from 'lucide-react';

export default function AdminPortal() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Auth Form State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Curated Items State
  const [curatedItems, setCuratedItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dgames' | 'dsocials' | 'prediction'>('dgames');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    url: '',
    icon_url: ''
  });
  const [dbStatusMsg, setDbStatusMsg] = useState('');
  const [dbErrorMsg, setDbErrorMsg] = useState('');

  // Sub-Admin State (Super-admin only)
  const [subAdminEmail, setSubAdminEmail] = useState('');
  const [subAdminPassword, setSubAdminPassword] = useState('');
  const [subAdminPerms, setSubAdminPerms] = useState({
    dgames: true,
    dsocials: true,
    prediction: true
  });
  const [adminList, setAdminList] = useState<any[]>([]);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // 1. Session state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchAdminProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchAdminProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch admin profile and role info
  const fetchAdminProfile = async (uid: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      } else {
        // Fallback for first-time login: if no profile exists, let's auto-upsert them as super_admin for bootstrap
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const defaultProfile = {
            id: uid,
            email: userData.user.email || '',
            role: 'super_admin',
            permissions: ['dgames', 'dsocials', 'prediction']
          };
          const { error: insertErr } = await supabase
            .from('admin_profiles')
            .upsert(defaultProfile);
          
          if (!insertErr) setProfile(defaultProfile);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch admin profile:', e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Load Curated items based on category
  const loadCuratedItems = async () => {
    setLoading(true);
    setDbErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('curated_items')
        .select('*')
        .order('id', { ascending: false });

      if (!error && data) {
        setCuratedItems(data);
      } else if (error) {
        setDbErrorMsg('Error loading database tables. Have you executed web/curated_setup.sql?');
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  // 4. Load admin accounts list (Super Admin only)
  const loadAdminProfilesList = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*');
      if (!error && data) {
        setAdminList(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (session) {
      loadCuratedItems();
      loadAdminProfilesList();
    }
  }, [session, activeTab]);

  // Auth Submit Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput
      });
      if (error) {
        setAuthError(error.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login request error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Curated items management functions
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbStatusMsg('');
    setDbErrorMsg('');

    // Check permissions
    if (profile?.role !== 'super_admin' && !profile?.permissions?.includes(activeTab)) {
      setDbErrorMsg(`Permission Denied: Sub-admins require '${activeTab}' permission to make modifications.`);
      return;
    }

    if (!itemForm.title || !itemForm.description || !itemForm.url) {
      setDbErrorMsg('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const newItem = {
        category: activeTab,
        title: itemForm.title,
        description: itemForm.description,
        url: itemForm.url,
        icon_url: itemForm.icon_url || 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png'
      };

      const { error } = await supabase
        .from('curated_items')
        .insert(newItem);

      if (error) throw error;

      setDbStatusMsg('Item added successfully! Live update pushed to mobile clients.');
      setItemForm({ title: '', description: '', url: '', icon_url: '' });
      setIsAddingItem(false);
      loadCuratedItems();
    } catch (e: any) {
      setDbErrorMsg(e.message || 'Failed to insert curated item into database.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    setDbStatusMsg('');
    setDbErrorMsg('');

    // Check permissions
    if (profile?.role !== 'super_admin' && !profile?.permissions?.includes(activeTab)) {
      setDbErrorMsg(`Permission Denied: Sub-admins require '${activeTab}' permission to delete entries.`);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this curated item? It will immediately disappear from users\' mobile screens.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('curated_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setDbStatusMsg('Item deleted from database successfully.');
      loadCuratedItems();
    } catch (e: any) {
      setDbErrorMsg(e.message || 'Failed to delete curated item.');
    } finally {
      setLoading(false);
    }
  };

  // Sub-Admin management
  const handleCreateSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbStatusMsg('');
    setDbErrorMsg('');

    if (profile?.role !== 'super_admin') {
      setDbErrorMsg('Permission Denied: Only Super Admins can add new sub-admin accounts.');
      return;
    }

    if (!subAdminEmail || !subAdminPassword) {
      setDbErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // Create user inside Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: subAdminEmail,
        password: subAdminPassword
      });

      if (error) throw error;
      if (!data.user) throw new Error('User creation failed.');

      // Map permissions array
      const permissionsList: string[] = [];
      if (subAdminPerms.dgames) permissionsList.push('dgames');
      if (subAdminPerms.dsocials) permissionsList.push('dsocials');
      if (subAdminPerms.prediction) permissionsList.push('prediction');

      // Create Admin Profile record
      const { error: profileErr } = await supabase
        .from('admin_profiles')
        .insert({
          id: data.user.id,
          email: subAdminEmail,
          role: 'sub_admin',
          permissions: permissionsList
        });

      if (profileErr) throw profileErr;

      setDbStatusMsg(`Sub-admin invited & account created: ${subAdminEmail}`);
      setSubAdminEmail('');
      setSubAdminPassword('');
      setIsAddingAdmin(false);
      loadAdminProfilesList();
    } catch (e: any) {
      setDbErrorMsg(e.message || 'Failed to create sub-admin profile.');
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on activeTab
  const filteredItems = curatedItems.filter(item => item.category === activeTab);

  if (!session) {
    return (
      <div className="admin-login-layout">
        <div className="login-card reveal-fade">
          <div className="login-header">
            <div className="login-icon-box">
              <Lock size={20} color="var(--primary)" />
            </div>
            <h2>Admin Web Panel</h2>
            <p>Authentication required to manage curated mobile listings.</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label htmlFor="email">Admin Email</label>
              <div className="input-field">
                <Mail size={16} />
                <input
                  type="email"
                  id="email"
                  placeholder="admin@numwallet.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Security Password</label>
              <div className="input-field">
                <Lock size={16} />
                <input
                  type="password"
                  id="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                />
              </div>
            </div>

            {authError ? (
              <div className="auth-error-banner">
                <AlertCircle size={14} />
                <span>{authError}</span>
              </div>
            ) : null}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Panel'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <Layers size={18} color="var(--primary)" />
          <span>NUM PANEL</span>
        </div>

        <div className="admin-profile-badge">
          <span className="admin-email">{profile?.email || session?.user?.email}</span>
          <span className={`admin-role-badge ${profile?.role === 'super_admin' ? 'super' : 'sub'}`}>
            {profile?.role === 'super_admin' ? 'Super Admin' : 'Sub Admin'}
          </span>
        </div>

        <div className="sidebar-divider" />

        <div className="sidebar-menu">
          <h4 className="menu-section-header">Curated Portals</h4>
          <button 
            className={`menu-btn ${activeTab === 'dgames' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dgames'); setIsAddingAdmin(false); }}
          >
            <Settings size={14} />
            <span>Decentralized Games</span>
          </button>
          <button 
            className={`menu-btn ${activeTab === 'dsocials' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dsocials'); setIsAddingAdmin(false); }}
          >
            <Settings size={14} />
            <span>Decentralized Socials</span>
          </button>
          <button 
            className={`menu-btn ${activeTab === 'prediction' ? 'active' : ''}`}
            onClick={() => { setActiveTab('prediction'); setIsAddingAdmin(false); }}
          >
            <Settings size={14} />
            <span>Prediction Markets</span>
          </button>

          {profile?.role === 'super_admin' && (
            <>
              <h4 className="menu-section-header">Admin Settings</h4>
              <button 
                className={`menu-btn ${isAddingAdmin ? 'active' : ''}`}
                onClick={() => setIsAddingAdmin(true)}
              >
                <Users size={14} />
                <span>Manage Sub-Admins</span>
              </button>
            </>
          )}
        </div>

        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="admin-main">
        {dbStatusMsg && (
          <div className="db-success-banner reveal-fade">
            <Check size={16} />
            <span>{dbStatusMsg}</span>
          </div>
        )}

        {dbErrorMsg && (
          <div className="db-error-banner reveal-fade">
            <AlertCircle size={16} />
            <span>{dbErrorMsg}</span>
          </div>
        )}

        {isAddingAdmin ? (
          /* Super Admin sub-admin creation portal */
          <div className="dashboard-content reveal-fade">
            <div className="content-header">
              <div>
                <h2>Create Sub-Admin Account</h2>
                <p>Register a new sub-admin in the Supabase schema and set customized read/write permissions.</p>
              </div>
            </div>

            <div className="row g-4" style={{ marginTop: '1rem' }}>
              <div className="col-lg-6">
                <form onSubmit={handleCreateSubAdmin} className="card-form">
                  <div className="input-group">
                    <label>Sub-Admin Email</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="subadmin@numwallet.com"
                      value={subAdminEmail}
                      onChange={(e) => setSubAdminEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Temporary Password (Min 6 chars)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={subAdminPassword}
                      onChange={(e) => setSubAdminPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label>Category Edit Permissions</label>
                    <div className="perms-checklist">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={subAdminPerms.dgames}
                          onChange={(e) => setSubAdminPerms({...subAdminPerms, dgames: e.target.checked})}
                        />
                        <span>Manage Decentralized Games</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={subAdminPerms.dsocials}
                          onChange={(e) => setSubAdminPerms({...subAdminPerms, dsocials: e.target.checked})}
                        />
                        <span>Manage Decentralized Socials</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={subAdminPerms.prediction}
                          onChange={(e) => setSubAdminPerms({...subAdminPerms, prediction: e.target.checked})}
                        />
                        <span>Manage Prediction Markets</span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="action-btn-filled" disabled={loading}>
                    Create Sub-Admin
                  </button>
                </form>
              </div>

              <div className="col-lg-6">
                <div className="admin-list-card">
                  <h3>Active Admin Accounts</h3>
                  <div className="admin-list">
                    {adminList.map(adm => (
                      <div key={adm.id} className="admin-list-item">
                        <div>
                          <Text style={{ fontWeight: '700', color: '#FFFFFF' }} className="adm-email">{adm.email}</Text>
                          <span className={`role-tag ${adm.role}`}>{adm.role}</span>
                        </div>
                        {adm.role === 'sub_admin' && (
                          <div className="perms-row">
                            {adm.permissions?.map((p: string) => (
                              <span key={p} className="perm-badge">{p}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Curated Items management page */
          <div className="dashboard-content reveal-fade">
            <div className="content-header">
              <div>
                <h2>
                  {activeTab === 'dgames' ? 'Curated Decentralized Games' : 
                   activeTab === 'dsocials' ? 'Curated Decentralized Socials' : 
                   'Curated Prediction Markets'}
                </h2>
                <p>Manage standard curated links and directories displayed in the users' mobile dashboard grids.</p>
              </div>
              <button 
                onClick={() => setIsAddingItem(!isAddingItem)} 
                className="action-btn-filled"
              >
                {isAddingItem ? 'Close Form' : 'Add Curated Link'}
              </button>
            </div>

            {isAddingItem && (
              <form onSubmit={handleAddItem} className="add-item-form reveal-fade">
                <h3>Add New Curated Listing</h3>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label>App/Platform Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Uniswap"
                      className="form-input"
                      value={itemForm.title}
                      onChange={(e) => setItemForm({...itemForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Logo Icon URL</label>
                    <input
                      type="url"
                      placeholder="e.g. https://domain.com/logo.png"
                      className="form-input"
                      value={itemForm.icon_url}
                      onChange={(e) => setItemForm({...itemForm, icon_url: e.target.value})}
                    />
                  </div>
                  <div className="col-12">
                    <label>Secure URL Link *</label>
                    <input
                      type="url"
                      placeholder="https://app.uniswap.org"
                      className="form-input"
                      value={itemForm.url}
                      onChange={(e) => setItemForm({...itemForm, url: e.target.value})}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label>Description *</label>
                    <input
                      type="text"
                      placeholder="Decentralized token swaps on EVM and Solana networks."
                      className="form-input"
                      value={itemForm.description}
                      onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-buttons">
                  <button type="submit" className="action-btn-filled" disabled={loading}>
                    Add curated listing
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingItem(false)} 
                    className="action-btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Curated Grid Table */}
            <div className="curated-items-table-card">
              {filteredItems.length === 0 ? (
                <div className="empty-table-state">
                  <Link2 size={32} color="var(--border)" />
                  <h4>No Listings In Category</h4>
                  <p>Add curated items to populate the category grid in users' wallets.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="curated-table">
                    <thead>
                      <tr>
                        <th>Logo</th>
                        <th>Title</th>
                        <th>Description</th>
                        <th>URL</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map(item => (
                        <tr key={item.id}>
                          <td>
                            <img 
                              src={item.icon_url} 
                              alt={item.title} 
                              className="table-item-logo"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/info/logo.png';
                              }}
                            />
                          </td>
                          <td><strong style={{ color: '#FFFFFF' }}>{item.title}</strong></td>
                          <td className="table-desc">{item.description}</td>
                          <td>
                            <a href={item.url} target="_blank" rel="noreferrer" className="table-url">
                              {item.url}
                            </a>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              onClick={() => handleDeleteItem(item.id)}
                              className="delete-item-btn"
                              title="Delete Listing"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Simple React standard Text helper mapping in web
function Text({ children, ...props }: any) {
  return <span {...props}>{children}</span>;
}
