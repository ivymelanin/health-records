import { supabase } from '../../lib/supabase';

import React, { useEffect, useMemo, useState } from 'react';

import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

/* ============================================================
   TYPES
============================================================ */

type ActivePage = 'dashboard' | 'staff' | 'facilities' | 'profile' | 'settings';

type HealthcareWorker = {
  id: string;                    // facility_staff.id
  user_id: string;               // facility_staff.user_id → profiles.id

  first_name: string;
  last_name: string;
  role: string;
  role_id: string | null;
  department: string | null;
  facility: string;
  facility_id: string | null;
  active: boolean;
  created_at: string | null;

  id_number: string | null;
  passport_number: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  staff_number: string | null;
  professional_council: string | null;
  registration_number: string | null;
  employment_status: string | null;
  osd_salary_grade: string | null;
  start_date: string | null;
  end_date: string | null;
  healthcare_role: string | null;

  assignment_start_date: string | null;
  assignment_end_date: string | null;
  employee_number: string | null;
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  idNumber?: string;
  phone?: string;
  address?: string;
  staffNumber?: string;
  email?: string;
  password?: string;
  role?: string;
  employmentStatus?: string;
  startDate?: string;
  council?: string;
  registrationNumber?: string;
  facility?: string;
};

const CLINICAL_ROLES = [
  'doctor',
  'laboratory',
  'nurse',
  'paramedic',
  'pharmacist',
  'radiology',
];

const EMPLOYMENT_STATUSES = [
  'Permanent',
  'Contract',
  'Temporary',
  'Intern',
  'Terminated',
  'Resigned',
];

const PROFESSIONAL_COUNCILS = ['HPCSA', 'SANC', 'SAPC', 'Other'];

/* ============================================================
   MAIN COMPONENT
============================================================ */

export default function StaffDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [healthcareWorkers, setHealthcareWorkers] = useState<HealthcareWorker[]>([]);
  const [showCreateWorker, setShowCreateWorker] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterEmploymentStatus, setFilterEmploymentStatus] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const [selectedWorker, setSelectedWorker] = useState<HealthcareWorker | null>(null);
  const [showViewWorker, setShowViewWorker] = useState(false);
  const [showEditWorker, setShowEditWorker] = useState(false);

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editIdNumber, setEditIdNumber] = useState('');
  const [editPassportNumber, setEditPassportNumber] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStaffNumber, setEditStaffNumber] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editEmploymentStatus, setEditEmploymentStatus] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editOsdSalaryGrade, setEditOsdSalaryGrade] = useState('');
  const [editCouncil, setEditCouncil] = useState('');
  const [editRegistrationNumber, setEditRegistrationNumber] = useState('');
  const [editFacility, setEditFacility] = useState('');
  const [editActive, setEditActive] = useState(true);

  const [workerFirstName, setWorkerFirstName] = useState('');
  const [workerLastName, setWorkerLastName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');
  const [workerRole, setWorkerRole] = useState('');
  const [workerDepartment, setWorkerDepartment] = useState('');
  const [workerFacility, setWorkerFacility] = useState('');
  const [workerIdNumber, setWorkerIdNumber] = useState('');
  const [workerPhone, setWorkerPhone] = useState('');
  const [workerAddress, setWorkerAddress] = useState('');
  const [workerStaffNumber, setWorkerStaffNumber] = useState('');
  const [workerEmploymentStatus, setWorkerEmploymentStatus] = useState('');
  const [workerStartDate, setWorkerStartDate] = useState('');
  const [workerEndDate, setWorkerEndDate] = useState('');
  const [workerCouncil, setWorkerCouncil] = useState('');
  const [workerRegistrationNumber, setWorkerRegistrationNumber] = useState('');
  const [workerOsdSalaryGrade, setWorkerOsdSalaryGrade] = useState('');

  const [workerRoles, setWorkerRoles] = useState<{ id: string; name: string }[]>([]);
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([]);
  const [profileInfo, setProfileInfo] = useState<any>(null);

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  /* ============================================================
     HELPERS
  ============================================================ */
  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const clearError = (field: keyof FormErrors) => {
    if (formErrors[field]) setFormErrors({ ...formErrors, [field]: undefined });
  };

  /* ============================================================
     FETCH HEALTHCARE WORKERS
  ============================================================ */
  const fetchHealthcareWorkers = async () => {
  try {
    const { data: staff, error: staffError } = await supabase
      .from('facility_staff')
      .select(`
        id,
        user_id,
        role,
        role_id,
        department,
        employee_number,
        active,
        facility_id,
        start_date,
        end_date,
        created_at,
        facilities ( name )
      `)
      .order('created_at', { ascending: false });

    if (staffError) throw staffError;

    const userIds = (staff ?? [])
      .map((w) => w.user_id)
      .filter(Boolean) as string[];

    if (userIds.length === 0) {
      setHealthcareWorkers([]);
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id, first_name, last_name, id_number, passport_number,
        phone, address, email, staff_number, professional_council,
        registration_number, employment_status, osd_salary_grade,
        start_date, end_date, healthcare_role, department, facility
      `)
      .in('id', userIds);

    if (profilesError) throw profilesError;

    // ─────────────────────────────────────────────────────────────
    // ✅ DIAGNOSTIC #1 — IMMEDIATELY AFTER THE profiles QUERY
    //    (after the `if (profilesError) throw profilesError;` line
    //     and BEFORE `const profileMap = ...`)
    // ─────────────────────────────────────────────────────────────
    console.log('STAFF DATA:', staff);
    console.log('PROFILE DATA:', profiles);
    console.log('PROFILE ERROR:', profilesError);
    const { data: { user } } = await supabase.auth.getUser();

console.log('CURRENT AUTH USER ID:', user?.id);
console.log('CURRENT AUTH EMAIL:', user?.email);
    // ─────────────────────────────────────────────────────────────

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    // ─────────────────────────────────────────────────────────────
    // ✅ DIAGNOSTIC #2 — IMMEDIATELY BEFORE setHealthcareWorkers(...)
    //    (after `profileMap` is built, before the state setter)
    // ─────────────────────────────────────────────────────────────
    console.log(
      'MAPPED WORKERS:',
      (staff ?? []).map((worker: any) => {
        const profile = profileMap.get(worker.user_id);

        return {
          user_id: worker.user_id,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
        };
      })
    );
    // ─────────────────────────────────────────────────────────────

    setHealthcareWorkers(
      (staff ?? []).map((worker: any) => {
        const profile = profileMap.get(worker.user_id);
        return {
          id: worker.id,
          user_id: worker.user_id,
          first_name: profile?.first_name ?? '',
          last_name: profile?.last_name ?? '',
          role: worker.role ?? profile?.healthcare_role ?? '',
          role_id: worker.role_id ?? null,
          department: worker.department ?? profile?.department ?? null,
          facility:
            worker.facilities?.name ??
            profile?.facility ??
            '',
          facility_id: worker.facility_id ?? null,
          active: worker.active ?? false,
          created_at: worker.created_at ?? null,

          id_number: profile?.id_number ?? null,
          passport_number: profile?.passport_number ?? null,
          phone: profile?.phone ?? null,
          address: profile?.address ?? null,
          email: profile?.email ?? null,
          staff_number: profile?.staff_number ?? null,
          professional_council: profile?.professional_council ?? null,
          registration_number: profile?.registration_number ?? null,
          employment_status: profile?.employment_status ?? null,
          osd_salary_grade: profile?.osd_salary_grade ?? null,
          start_date: profile?.start_date ?? null,
          end_date: profile?.end_date ?? null,
          healthcare_role: profile?.healthcare_role ?? null,

          assignment_start_date: worker.start_date ?? null,
          assignment_end_date: worker.end_date ?? null,
          employee_number: worker.employee_number ?? null,
        };
      })
    );
  } catch (error) {
    console.error('Error fetching healthcare workers:', error);
    showError('Unable to load healthcare workers.');
  }
};

  /* ============================================================
     FETCH ROLES / FACILITIES / LOGGED-IN PROFILE
  ============================================================ */
  const fetchWorkerRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name')
        .in('name', CLINICAL_ROLES)
        .order('name');
      if (error) throw error;
      setWorkerRoles(data ?? []);
    } catch (error) {
      console.error('Error fetching worker roles:', error);
      setWorkerRoles([]);
    }
  };

  const fetchFacilities = async () => {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name')
        .order('name');
      if (error) throw error;
      setFacilities(data ?? []);
    } catch (error) {
      console.error('Error fetching facilities:', error);
      setFacilities([]);
    }
  };

  const fetchLoggedInProfile = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) {
        console.error('PROFILE FETCH ERROR:', error);
        return;
      }
      setProfileInfo(data);
    } catch (err) {
      console.error('Error fetching logged-in profile:', err);
    }
  };

  useEffect(() => {
    fetchHealthcareWorkers();
    fetchWorkerRoles();
    fetchFacilities();
    fetchLoggedInProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Logout error:', err);
      showError('Unable to log out. Please try again.');
    }
  };

  const handleWebDateChange = (
    field: 'startDate' | 'endDate',
    value: string
  ) => {
    if (field === 'startDate') {
      setWorkerStartDate(value);
      clearError('startDate');
    } else {
      setWorkerEndDate(value);
    }
  };

  /* ============================================================
     DERIVED: FILTERED WORKERS
  ============================================================ */
  const filteredWorkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return healthcareWorkers.filter((w) => {
      if (q) {
        const haystack = [
          w.first_name,
          w.last_name,
          w.staff_number,
          w.id_number,
          w.passport_number,
        ]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase());
        if (!haystack.some((v) => v.includes(q))) return false;
      }
      if (filterRole && w.role !== filterRole) return false;
      if (filterDepartment && (w.department ?? '') !== filterDepartment) return false;
      if (
        filterEmploymentStatus &&
        (w.employment_status ?? '') !== filterEmploymentStatus
      )
        return false;
      if (filterActive === 'active' && !w.active) return false;
      if (filterActive === 'inactive' && w.active) return false;
      return true;
    });
  }, [
    healthcareWorkers,
    searchQuery,
    filterRole,
    filterDepartment,
    filterEmploymentStatus,
    filterActive,
  ]);

  /* ============================================================
     DERIVED: STATISTICS
  ============================================================ */
  const stats = useMemo(() => {
    const total = healthcareWorkers.length;
    const active = healthcareWorkers.filter((w) => w.active).length;
    const inactive = total - active;

    const byRole: Record<string, number> = {};
    healthcareWorkers.forEach((w) => {
      const key = w.role || 'unspecified';
      byRole[key] = (byRole[key] ?? 0) + 1;
    });

    const recent = [...healthcareWorkers]
      .sort((a, b) => {
        const aT = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bT = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bT - aT;
      })
      .slice(0, 5);

    return { total, active, inactive, byRole, recent };
  }, [healthcareWorkers]);

  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    healthcareWorkers.forEach((w) => {
      if (w.department) set.add(w.department);
    });
    return Array.from(set).sort();
  }, [healthcareWorkers]);

  const availableRoles = useMemo(() => {
    const set = new Set<string>();
    healthcareWorkers.forEach((w) => {
      if (w.role) set.add(w.role);
    });
    return Array.from(set).sort();
  }, [healthcareWorkers]);

  const availableEmploymentStatuses = useMemo(() => {
    const set = new Set<string>();
    healthcareWorkers.forEach((w) => {
      if (w.employment_status) set.add(w.employment_status);
    });
    return Array.from(set).sort();
  }, [healthcareWorkers]);

  /* ============================================================
     VALIDATE + CREATE
  ============================================================ */
  const validateForm = () => {
    const errors: FormErrors = {};
    if (!workerFirstName.trim()) errors.firstName = 'First name is required';
    if (!workerLastName.trim()) errors.lastName = 'Last name is required';
    if (!workerIdNumber.trim()) errors.idNumber = 'ID or passport number is required';
    if (!workerPhone.trim()) errors.phone = 'Contact number is required';
    if (!workerAddress.trim()) errors.address = 'Address is required';
    if (!workerStaffNumber.trim()) errors.staffNumber = 'Staff number is required';
    if (!workerEmail.trim()) errors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(workerEmail.trim()))
      errors.email = 'Please enter a valid email address';
    if (!workerPassword) errors.password = 'Temporary password is required';
    else if (workerPassword.length < 6)
      errors.password = 'Password must be at least 6 characters';
    if (!workerRole) errors.role = 'Please select a role';
    if (!workerEmploymentStatus)
      errors.employmentStatus = 'Please select employment status';
    if (!workerStartDate.trim())
      errors.startDate = 'Employment start date is required';
    if (!workerCouncil) errors.council = 'Please select a professional council';
    if (!workerRegistrationNumber.trim())
      errors.registrationNumber = 'Professional registration number is required';
    if (!workerFacility) errors.facility = 'Please select a facility';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const createHealthcareWorker = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-healthcare-worker',
        {
          body: {
            first_name: workerFirstName.trim(),
            last_name: workerLastName.trim(),
            email: workerEmail.trim().toLowerCase(),
            password: workerPassword,
            role: workerRole,
            department: workerDepartment.trim() || null,
            facility_id: workerFacility,
            id_number: workerIdNumber.trim(),
            phone: workerPhone.trim(),
            address: workerAddress.trim(),
            staff_number: workerStaffNumber.trim(),
            employment_status: workerEmploymentStatus,
            start_date: workerStartDate.trim(),
            end_date: workerEndDate.trim() || null,
            professional_council: workerCouncil,
            professional_registration_number: workerRegistrationNumber.trim(),
            osd_salary_grade: workerOsdSalaryGrade.trim() || null,
          },
        }
      );

      if (error) {
        console.error('FUNCTION ERROR:', error);
        if ('context' in error && error.context) {
          const errorBody = await error.context.json();
          console.error('FUNCTION ERROR BODY:', errorBody);
          throw new Error(errorBody?.error || 'Unable to create healthcare worker.');
        }
        throw error;
      }
      if (data?.error) throw new Error(data.error);

      resetForm();
      setShowCreateWorker(false);
      await fetchHealthcareWorkers();
      showSuccess('Healthcare worker created successfully.');
    } catch (error) {
      console.error('Error creating healthcare worker:', error);
      showError(
        error instanceof Error
          ? error.message
          : 'Unable to create healthcare worker.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setWorkerFirstName(''); setWorkerLastName(''); setWorkerIdNumber('');
    setWorkerPhone(''); setWorkerAddress(''); setWorkerStaffNumber('');
    setWorkerEmail(''); setWorkerPassword(''); setWorkerRole('');
    setWorkerDepartment(''); setWorkerEmploymentStatus('');
    setWorkerStartDate(''); setWorkerEndDate(''); setWorkerCouncil('');
    setWorkerRegistrationNumber(''); setWorkerOsdSalaryGrade('');
    setWorkerFacility(''); setFormErrors({});
  };

  /* ============================================================
     VIEW / EDIT / ACTIVATE
  ============================================================ */
  const openViewWorker = (worker: HealthcareWorker) => {
    setSelectedWorker(worker);
    setShowViewWorker(true);
  };

  const openEditWorker = (worker: HealthcareWorker) => {
    setSelectedWorker(worker);
    setEditFirstName(worker.first_name ?? '');
    setEditLastName(worker.last_name ?? '');
    setEditIdNumber(worker.id_number ?? '');
    setEditPassportNumber(worker.passport_number ?? '');
    setEditPhone(worker.phone ?? '');
    setEditAddress(worker.address ?? '');
    setEditStaffNumber(worker.staff_number ?? '');
    setEditRole(worker.role ?? '');
    setEditDepartment(worker.department ?? '');
    setEditEmploymentStatus(worker.employment_status ?? '');
    setEditStartDate(worker.start_date ?? '');
    setEditEndDate(worker.end_date ?? '');
    setEditOsdSalaryGrade(worker.osd_salary_grade ?? '');
    setEditCouncil(worker.professional_council ?? '');
    setEditRegistrationNumber(worker.registration_number ?? '');
    setEditFacility(worker.facility_id ?? '');
    setEditActive(worker.active);
    setShowViewWorker(false);
    setShowEditWorker(true);
  };

  const saveWorkerEdits = async () => {
    if (!selectedWorker) return;
    setIsLoading(true);
    try {
      const profileUpdate: Record<string, any> = {
        first_name: editFirstName.trim() || null,
        last_name: editLastName.trim() || null,
        id_number: editIdNumber.trim() || null,
        passport_number: editPassportNumber.trim() || null,
        phone: editPhone.trim() || null,
        address: editAddress.trim() || null,
        staff_number: editStaffNumber.trim() || null,
        professional_council: editCouncil || null,
        registration_number: editRegistrationNumber.trim() || null,
        employment_status: editEmploymentStatus || null,
        osd_salary_grade: editOsdSalaryGrade.trim() || null,
        start_date: editStartDate || null,
        end_date: editEndDate || null,
        healthcare_role: editRole || null,
        department: editDepartment.trim() || null,
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', selectedWorker.user_id);
      if (profileError) {
        console.error('PROFILE UPDATE ERROR:', profileError);
        throw profileError;
      }

      const matchedRole = workerRoles.find(
        (r) => r.name.toLowerCase() === editRole.toLowerCase()
      );

      const staffUpdate: Record<string, any> = {
        role: editRole || null,
        role_id: matchedRole?.id ?? null,
        department: editDepartment.trim() || null,
        employee_number: editStaffNumber.trim() || null,
        active: editActive,
        start_date: editStartDate || null,
        end_date: editEndDate || null,
        facility_id: editFacility || selectedWorker.facility_id,
      };

      const { error: staffError } = await supabase
        .from('facility_staff')
        .update(staffUpdate)
        .eq('id', selectedWorker.id);
      if (staffError) {
        console.error('FACILITY_STAFF UPDATE ERROR:', staffError);
        throw staffError;
      }

      setShowEditWorker(false);
      setSelectedWorker(null);
      await fetchHealthcareWorkers();
      showSuccess('Worker updated successfully.');
    } catch (error) {
      console.error('Error updating worker:', error);
      showError(error instanceof Error ? error.message : 'Unable to update worker.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWorkerActive = async (
    worker: HealthcareWorker,
    nextActive: boolean
  ) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('facility_staff')
        .update({ active: nextActive })
        .eq('id', worker.id);
      if (error) {
        console.error('ACTIVE TOGGLE ERROR:', error);
        throw error;
      }
      await fetchHealthcareWorkers();
      showSuccess(nextActive ? 'Worker activated.' : 'Worker deactivated.');
      if (selectedWorker && selectedWorker.id === worker.id) {
        setSelectedWorker({ ...selectedWorker, active: nextActive });
      }
    } catch (error) {
      console.error('Error toggling worker active state:', error);
      showError('Unable to update worker status.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <View style={styles.appContainer}>
      {/* SIDEBAR */}
      <View style={[styles.sidebar, !sidebarOpen && styles.sidebarCollapsed]}>
        <View style={styles.logoArea}>
          <Image
            source={require('../../assets/sa-government-logo.png')}
            style={sidebarOpen ? styles.governmentLogo : styles.governmentLogoCollapsed}
            resizeMode="contain"
          />
          {sidebarOpen && (
            <View style={styles.logoTextArea}>
              <Text style={styles.carelinkText}>CARELINK</Text>
              <Text style={styles.logoSubtitle}>Electronic Health Records</Text>
              <Text style={styles.departmentText}>Department of Health</Text>
            </View>
          )}
        </View>

        {sidebarOpen && (
          <View style={styles.sidebarMenu}>
            <Text style={styles.menuLabel}>NAVIGATION</Text>

            <NavItem icon="⌂" label="Dashboard"
              active={activePage === 'dashboard'}
              onPress={() => setActivePage('dashboard')} />
            <NavItem icon="♙" label="Staff"
              active={activePage === 'staff'}
              onPress={() => setActivePage('staff')} />
            <NavItem icon="⌂" label="Facilities"
              active={activePage === 'facilities'}
              onPress={() => setActivePage('facilities')} />
            <NavItem icon="◉" label="Profile"
              active={activePage === 'profile'}
              onPress={() => setActivePage('profile')} />
            <NavItem icon="⚙" label="Settings"
              active={activePage === 'settings'}
              onPress={() => setActivePage('settings')} />

            <View style={styles.navDivider} />

            <Pressable style={styles.navItem} onPress={handleLogout}>
              <Text style={styles.navIcon}>⎋</Text>
              <Text style={styles.navText}>Logout</Text>
            </Pressable>
          </View>
        )}

        {sidebarOpen && (
          <View style={styles.sidebarFooter}>
            <Text style={styles.secureText}>🔒 Secure Administration</Text>
            <Text style={styles.versionText}>CARELINK EHR v1.0</Text>
          </View>
        )}
      </View>

      {/* MAIN */}
      <View style={styles.main}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.menuButton}
              onPress={() => setSidebarOpen(!sidebarOpen)}>
              <Text style={styles.menuButtonText}>☰</Text>
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>
                {activePage === 'dashboard' && 'Dashboard'}
                {activePage === 'staff' && 'Staff Management'}
                {activePage === 'facilities' && 'Facilities'}
                {activePage === 'profile' && 'My Profile'}
                {activePage === 'settings' && 'Settings'}
              </Text>
              <Text style={styles.headerSubtitle}>
                CARELINK · Electronic Health Records
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>♧</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </Pressable>
            <View style={styles.profileMini}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(profileInfo?.first_name?.charAt(0) ?? 'A').toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={styles.profileName}>
                  {profileInfo
                    ? `${profileInfo.first_name ?? ''} ${profileInfo.last_name ?? ''}`.trim() ||
                      'System Admin'
                    : 'System Admin'}
                </Text>
                <Text style={styles.profileRole}>
                  {profileInfo?.role ?? 'Administrator'}
                </Text>
              </View>
              <Text style={styles.chevron}>⌄</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {activePage === 'dashboard' && (
            <DashboardPage
              stats={stats}
              onViewWorker={openViewWorker}
              onGoToStaff={() => setActivePage('staff')}
            />
          )}

          {activePage === 'staff' && (
            <StaffPage
              healthcareWorkers={filteredWorkers}
              totalCount={healthcareWorkers.length}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterRole={filterRole}
              setFilterRole={setFilterRole}
              filterDepartment={filterDepartment}
              setFilterDepartment={setFilterDepartment}
              filterEmploymentStatus={filterEmploymentStatus}
              setFilterEmploymentStatus={setFilterEmploymentStatus}
              filterActive={filterActive}
              setFilterActive={setFilterActive}
              availableRoles={availableRoles}
              availableDepartments={availableDepartments}
              availableEmploymentStatuses={availableEmploymentStatuses}
              onCreateWorker={() => { resetForm(); setShowCreateWorker(true); }}
              onView={openViewWorker}
              onEdit={openEditWorker}
              onToggleActive={toggleWorkerActive}
            />
          )}

          {activePage === 'facilities' && (
            <FacilitiesPage facilities={facilities} healthcareWorkers={healthcareWorkers} />
          )}

          {activePage === 'profile' && <ProfilePage profileInfo={profileInfo} />}

          {activePage === 'settings' && <SettingsPage />}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              CARELINK Electronic Health Records System
            </Text>
            <Text style={styles.footerText}>
              Department of Health – Republic of South Africa
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* ============================================================
          CREATE WORKER MODAL
      ============================================================ */}
      <Modal
        visible={showCreateWorker}
        transparent
        animationType="slide"
        onRequestClose={() => { resetForm(); setShowCreateWorker(false); }}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <View style={styles.modalIconContainer}>
                      <Text style={styles.modalIcon}>👤</Text>
                    </View>
                    <View>
                      <Text style={styles.modalTitle}>Create Healthcare Worker</Text>
                      <Text style={styles.modalSubtitle}>
                        Create a secure CARELINK staff account
                      </Text>
                    </View>
                  </View>
                  <Pressable style={styles.modalCloseButton}
                    onPress={() => { resetForm(); setShowCreateWorker(false); }}>
                    <Text style={styles.closeButton}>×</Text>
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.modalScrollView}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="always"
                  keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                >
                  <View style={styles.modalPrivacyNotice}>
                    <View style={styles.privacyIconContainer}>
                      <Text style={styles.privacyIcon}>🔒</Text>
                    </View>
                    <View style={styles.privacyContent}>
                      <Text style={styles.modalPrivacyTitle}>
                        Secure Staff Registration
                      </Text>
                      <Text style={styles.modalPrivacyText}>
                        The healthcare worker will receive an account with access
                        based on their assigned role, department, and facility.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <CreateField label="First Name" required value={workerFirstName}
                      onChangeText={(t) => { setWorkerFirstName(t); clearError('firstName'); }}
                      placeholder="Enter first name" error={formErrors.firstName}
                      disabled={isLoading} />
                    <CreateField label="Last Name" required value={workerLastName}
                      onChangeText={(t) => { setWorkerLastName(t); clearError('lastName'); }}
                      placeholder="Enter last name" error={formErrors.lastName}
                      disabled={isLoading} />
                    <CreateField label="ID / Passport Number" required value={workerIdNumber}
                      onChangeText={(t) => { setWorkerIdNumber(t); clearError('idNumber'); }}
                      placeholder="Enter ID or passport number" error={formErrors.idNumber}
                      disabled={isLoading} />
                    <CreateField label="Contact Number" required value={workerPhone}
                      onChangeText={(t) => { setWorkerPhone(t); clearError('phone'); }}
                      placeholder="Enter contact number" keyboardType="phone-pad"
                      error={formErrors.phone} disabled={isLoading} />
                    <CreateField label="Address" required value={workerAddress}
                      onChangeText={(t) => { setWorkerAddress(t); clearError('address'); }}
                      placeholder="Enter residential address" multiline
                      error={formErrors.address} disabled={isLoading} />
                    <CreateField label="Staff Number" required value={workerStaffNumber}
                      onChangeText={(t) => { setWorkerStaffNumber(t); clearError('staffNumber'); }}
                      placeholder="Enter staff number" error={formErrors.staffNumber}
                      disabled={isLoading} />
                    <CreateField label="Email Address" required value={workerEmail}
                      onChangeText={(t) => { setWorkerEmail(t); clearError('email'); }}
                      placeholder="Enter email address" keyboardType="email-address"
                      autoCapitalize="none" error={formErrors.email} disabled={isLoading} />
                    <CreateField label="Temporary Password" required value={workerPassword}
                      onChangeText={(t) => { setWorkerPassword(t); clearError('password'); }}
                      placeholder="Enter temporary password (min 6 characters)"
                      secureTextEntry error={formErrors.password} disabled={isLoading} />

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>
                        Healthcare Role <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={styles.optionsGrid}>
                        {workerRoles.map((role) => (
                          <Pressable key={role.id}
                            style={[styles.optionCard,
                              workerRole === role.name && styles.optionCardSelected]}
                            onPress={() => { setWorkerRole(role.name); clearError('role'); }}
                            disabled={isLoading}>
                            <View style={styles.optionCardContent}>
                              <View style={[styles.radioButton,
                                workerRole === role.name && styles.radioButtonSelected]}>
                                {workerRole === role.name && <View style={styles.radioButtonInner} />}
                              </View>
                              <Text style={[styles.optionCardText,
                                workerRole === role.name && styles.optionCardTextSelected]}>
                                {role.name}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                      {formErrors.role && <Text style={styles.errorText}>{formErrors.role}</Text>}
                    </View>

                    <CreateField label="Department (Optional)" value={workerDepartment}
                      onChangeText={setWorkerDepartment} placeholder="Enter department"
                      disabled={isLoading} />

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>
                        Employment Status <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={styles.optionsGrid}>
                        {EMPLOYMENT_STATUSES.map((status) => (
                          <Pressable key={status}
                            style={[styles.optionCard,
                              workerEmploymentStatus === status && styles.optionCardSelected]}
                            onPress={() => { setWorkerEmploymentStatus(status); clearError('employmentStatus'); }}
                            disabled={isLoading}>
                            <View style={styles.optionCardContent}>
                              <View style={[styles.radioButton,
                                workerEmploymentStatus === status && styles.radioButtonSelected]}>
                                {workerEmploymentStatus === status &&
                                  <View style={styles.radioButtonInner} />}
                              </View>
                              <Text style={[styles.optionCardText,
                                workerEmploymentStatus === status && styles.optionCardTextSelected]}>
                                {status}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                      {formErrors.employmentStatus && (
                        <Text style={styles.errorText}>{formErrors.employmentStatus}</Text>
                      )}
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>
                        Employment Start Date <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      {Platform.OS === 'web' ? (
                        React.createElement('input' as any, {
                          type: 'date',
                          value: workerStartDate,
                          onChange: (event: any) =>
                            handleWebDateChange('startDate', event.target.value),
                          disabled: isLoading,
                          style: {
                            height: 46, width: '100%', boxSizing: 'border-box',
                            border: `1.5px solid ${formErrors.startDate ? '#DC2626' : '#CBD5E1'}`,
                            borderRadius: 8, paddingLeft: 14, paddingRight: 14,
                            color: '#0F172A', fontSize: 13,
                            backgroundColor: '#FFFFFF', fontFamily: 'inherit',
                          },
                        })
                      ) : (
                        <TextInput selectTextOnFocus={false} autoCorrect={false}
                          spellCheck={false} value={workerStartDate}
                          onChangeText={(text) => { setWorkerStartDate(text); clearError('startDate'); }}
                          placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8"
                          style={[styles.input, formErrors.startDate && styles.inputError]}
                          editable={!isLoading} />
                      )}
                      {formErrors.startDate && (
                        <Text style={styles.errorText}>{formErrors.startDate}</Text>
                      )}
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Employment End Date</Text>
                      {Platform.OS === 'web' ? (
                        React.createElement('input' as any, {
                          type: 'date',
                          value: workerEndDate,
                          onChange: (event: any) =>
                            handleWebDateChange('endDate', event.target.value),
                          disabled: isLoading,
                          style: {
                            height: 46, width: '100%', boxSizing: 'border-box',
                            border: '1.5px solid #CBD5E1', borderRadius: 8,
                            paddingLeft: 14, paddingRight: 14, color: '#0F172A',
                            fontSize: 13, backgroundColor: '#FFFFFF',
                            fontFamily: 'inherit',
                          },
                        })
                      ) : (
                        <TextInput selectTextOnFocus={false} autoCorrect={false}
                          spellCheck={false} value={workerEndDate}
                          onChangeText={setWorkerEndDate}
                          placeholder="YYYY-MM-DD (optional)" placeholderTextColor="#94A3B8"
                          style={styles.input} editable={!isLoading} />
                      )}
                    </View>

                    <CreateField label="OSD Salary Grade (Optional)" value={workerOsdSalaryGrade}
                      onChangeText={setWorkerOsdSalaryGrade}
                      placeholder="Enter OSD salary grade" disabled={isLoading} />

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>
                        Professional Council <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={styles.optionsGrid}>
                        {PROFESSIONAL_COUNCILS.map((council) => (
                          <Pressable key={council}
                            style={[styles.optionCard,
                              workerCouncil === council && styles.optionCardSelected]}
                            onPress={() => { setWorkerCouncil(council); clearError('council'); }}
                            disabled={isLoading}>
                            <View style={styles.optionCardContent}>
                              <View style={[styles.radioButton,
                                workerCouncil === council && styles.radioButtonSelected]}>
                                {workerCouncil === council &&
                                  <View style={styles.radioButtonInner} />}
                              </View>
                              <Text style={[styles.optionCardText,
                                workerCouncil === council && styles.optionCardTextSelected]}>
                                {council}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                      {formErrors.council && (
                        <Text style={styles.errorText}>{formErrors.council}</Text>
                      )}
                    </View>

                    <CreateField label="Professional Registration Number" required
                      value={workerRegistrationNumber}
                      onChangeText={(t) => { setWorkerRegistrationNumber(t); clearError('registrationNumber'); }}
                      placeholder="Enter professional registration number"
                      error={formErrors.registrationNumber} disabled={isLoading} />

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>
                        Facility <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={styles.optionsGrid}>
                        {facilities.map((facility) => (
                          <Pressable key={facility.id}
                            style={[styles.optionCard,
                              workerFacility === facility.id && styles.optionCardSelected]}
                            onPress={() => { setWorkerFacility(facility.id); clearError('facility'); }}
                            disabled={isLoading}>
                            <View style={styles.optionCardContent}>
                              <View style={[styles.radioButton,
                                workerFacility === facility.id && styles.radioButtonSelected]}>
                                {workerFacility === facility.id &&
                                  <View style={styles.radioButtonInner} />}
                              </View>
                              <Text style={[styles.optionCardText,
                                workerFacility === facility.id && styles.optionCardTextSelected]}>
                                {facility.name}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                      {formErrors.facility && (
                        <Text style={styles.errorText}>{formErrors.facility}</Text>
                      )}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable style={styles.cancelButton}
                    onPress={() => { resetForm(); setShowCreateWorker(false); }}
                    disabled={isLoading}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.createButton, isLoading && styles.disabledButton]}
                    disabled={isLoading}
                    onPress={createHealthcareWorker}>
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.loadingText}>Creating...</Text>
                      </View>
                    ) : (
                      <Text style={styles.createButtonText}>Create Worker</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ============================================================
          VIEW WORKER MODAL
      ============================================================ */}
      <Modal visible={showViewWorker} transparent animationType="slide"
        onRequestClose={() => setShowViewWorker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalIconContainer}>
                    <Text style={styles.modalIcon}>👤</Text>
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>
                      {selectedWorker?.first_name} {selectedWorker?.last_name}
                    </Text>
                    <Text style={styles.modalSubtitle}>Worker profile</Text>
                  </View>
                </View>
                <Pressable style={styles.modalCloseButton}
                  onPress={() => setShowViewWorker(false)}>
                  <Text style={styles.closeButton}>×</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.modalScrollView}
                contentContainerStyle={styles.modalScrollContent}>
                {selectedWorker && (
                  <View style={styles.detailSections}>
                    <DetailSection title="Personal Information" rows={[
                      ['First Name', selectedWorker.first_name],
                      ['Last Name', selectedWorker.last_name],
                      ['ID Number', selectedWorker.id_number],
                      ['Passport Number', selectedWorker.passport_number],
                      ['Phone', selectedWorker.phone],
                      ['Address', selectedWorker.address],
                      ['Email', selectedWorker.email],
                    ]} />
                    <DetailSection title="Employment Information" rows={[
                      ['Staff Number', selectedWorker.staff_number],
                      ['Healthcare Role', selectedWorker.role],
                      ['Department', selectedWorker.department],
                      ['Employment Status', selectedWorker.employment_status],
                      ['Start Date', selectedWorker.start_date],
                      ['End Date', selectedWorker.end_date],
                      ['OSD Salary Grade', selectedWorker.osd_salary_grade],
                    ]} />
                    <DetailSection title="Professional Information" rows={[
                      ['Professional Council', selectedWorker.professional_council],
                      ['Registration Number', selectedWorker.registration_number],
                    ]} />
                    <DetailSection title="Facility Information" rows={[
                      ['Facility', selectedWorker.facility],
                      ['Facility Role', selectedWorker.role],
                      ['Department', selectedWorker.department],
                      ['Assignment Start', selectedWorker.assignment_start_date],
                      ['Assignment End', selectedWorker.assignment_end_date],
                      ['Status', selectedWorker.active ? 'Active' : 'Inactive'],
                    ]} />
                  </View>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable style={styles.cancelButton}
                  onPress={() => setShowViewWorker(false)}>
                  <Text style={styles.cancelButtonText}>Close</Text>
                </Pressable>
                {selectedWorker && (
                  <Pressable
                    style={[styles.createButton,
                      selectedWorker.active
                        ? styles.deactivateButton
                        : styles.activateButton]}
                    onPress={() =>
                      toggleWorkerActive(selectedWorker, !selectedWorker.active)
                    }
                    disabled={isLoading}>
                    <Text style={styles.createButtonText}>
                      {selectedWorker.active ? 'Deactivate Worker' : 'Activate Worker'}
                    </Text>
                  </Pressable>
                )}
                <Pressable style={styles.createButton}
                  onPress={() => selectedWorker && openEditWorker(selectedWorker)}
                  disabled={isLoading}>
                  <Text style={styles.createButtonText}>Edit Worker</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================
          EDIT WORKER MODAL
      ============================================================ */}
      <Modal visible={showEditWorker} transparent animationType="slide"
        onRequestClose={() => setShowEditWorker(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}>
            <View style={styles.modalContainer}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderLeft}>
                    <View style={styles.modalIconContainer}>
                      <Text style={styles.modalIcon}>✎</Text>
                    </View>
                    <View>
                      <Text style={styles.modalTitle}>Edit Worker</Text>
                      <Text style={styles.modalSubtitle}>
                        {selectedWorker?.first_name} {selectedWorker?.last_name}
                      </Text>
                    </View>
                  </View>
                  <Pressable style={styles.modalCloseButton}
                    onPress={() => setShowEditWorker(false)}>
                    <Text style={styles.closeButton}>×</Text>
                  </Pressable>
                </View>

                <ScrollView style={styles.modalScrollView}
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTaps="always">
                  <View style={styles.formSection}>
                    <Text style={styles.sectionHeading}>Personal Information</Text>
                    <CreateField label="First Name" value={editFirstName}
                      onChangeText={setEditFirstName} placeholder="First name"
                      disabled={isLoading} />
                    <CreateField label="Last Name" value={editLastName}
                      onChangeText={setEditLastName} placeholder="Last name"
                      disabled={isLoading} />
                    <CreateField label="ID Number" value={editIdNumber}
                      onChangeText={setEditIdNumber} placeholder="ID number"
                      disabled={isLoading} />
                    <CreateField label="Passport Number" value={editPassportNumber}
                      onChangeText={setEditPassportNumber} placeholder="Passport number"
                      disabled={isLoading} />
                    <CreateField label="Phone" value={editPhone}
                      onChangeText={setEditPhone} placeholder="Phone"
                      keyboardType="phone-pad" disabled={isLoading} />
                    <CreateField label="Address" value={editAddress}
                      onChangeText={setEditAddress} placeholder="Address"
                      multiline disabled={isLoading} />

                    <Text style={styles.sectionHeading}>Employment Information</Text>

                    <CreateField label="Staff Number" value={editStaffNumber}
                      onChangeText={setEditStaffNumber} placeholder="Staff number"
                      disabled={isLoading} />

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Healthcare Role</Text>
                      <View style={styles.optionsGrid}>
                        {workerRoles.map((role) => (
                          <Pressable key={role.id}
                            style={[styles.optionCard,
                              editRole === role.name && styles.optionCardSelected]}
                            onPress={() => setEditRole(role.name)}
                            disabled={isLoading}>
                            <View style={styles.optionCardContent}>
                              <View style={[styles.radioButton,
                                editRole === role.name && styles.radioButtonSelected]}>
                                {editRole === role.name &&
                                  <View style={styles.radioButtonInner} />}
                              </View>
                              <Text style={[styles.optionCardText,
                                editRole === role.name && styles.optionCardTextSelected]}>
                                {role.name}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <CreateField label="Department" value={editDepartment}
                      onChangeText={setEditDepartment} placeholder="Department"
                      disabled={isLoading} />

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Employment Status</Text>
                      <View style={styles.optionsGrid}>
                        {EMPLOYMENT_STATUSES.map((status) => (
                          <Pressable key={status}
                            style={[styles.optionCard,
                              editEmploymentStatus === status && styles.optionCardSelected]}
                            onPress={() => setEditEmploymentStatus(status)}
                            disabled={isLoading}>
                            <View style={styles.optionCardContent}>
                              <View style={[styles.radioButton,
                                editEmploymentStatus === status && styles.radioButtonSelected]}>
                                {editEmploymentStatus === status &&
                                  <View style={styles.radioButtonInner} />}
                              </View>
                              <Text style={[styles.optionCardText,
                                editEmploymentStatus === status && styles.optionCardTextSelected]}>
                                {status}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Employment Start Date</Text>
                      {Platform.OS === 'web' ? (
                        React.createElement('input' as any, {
                          type: 'date', value: editStartDate,
                          onChange: (e: any) => setEditStartDate(e.target.value),
                          disabled: isLoading,
                          style: {
                            height: 46, width: '100%', boxSizing: 'border-box',
                            border: '1.5px solid #CBD5E1', borderRadius: 8,
                            paddingLeft: 14, paddingRight: 14, color: '#0F172A',
                            fontSize: 13, backgroundColor: '#FFFFFF',
                            fontFamily: 'inherit',
                          },
                        })
                      ) : (
                        <TextInput value={editStartDate}
                          onChangeText={setEditStartDate}
                          placeholder="YYYY-MM-DD" placeholderTextColor="#94A3B8"
                          style={styles.input} editable={!isLoading} />
                      )}
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Employment End Date</Text>
                      {Platform.OS === 'web' ? (
                        React.createElement('input' as any, {
                          type: 'date', value: editEndDate,
                          onChange: (e: any) => setEditEndDate(e.target.value),
                          disabled: isLoading,
                          style: {
                            height: 46, width: '100%', boxSizing: 'border-box',
                            border: '1.5px solid #CBD5E1', borderRadius: 8,
                            paddingLeft: 14, paddingRight: 14, color: '#0F172A',
                            fontSize: 13, backgroundColor: '#FFFFFF',
                            fontFamily: 'inherit',
                          },
                        })
                      ) : (
                        <TextInput value={editEndDate}
                          onChangeText={setEditEndDate}
                          placeholder="YYYY-MM-DD (optional)" placeholderTextColor="#94A3B8"
                          style={styles.input} editable={!isLoading} />
                      )}
                    </View>

                    <CreateField label="OSD Salary Grade" value={editOsdSalaryGrade}
                      onChangeText={setEditOsdSalaryGrade}
                      placeholder="OSD salary grade" disabled={isLoading} />

                    <Text style={styles.sectionHeading}>Professional Information</Text>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Professional Council</Text>
                      <View style={styles.optionsGrid}>
                        {PROFESSIONAL_COUNCILS.map((council) => (
                          <Pressable key={council}
                            style={[styles.optionCard,
                              editCouncil === council && styles.optionCardSelected]}
                            onPress={() => setEditCouncil(council)}
                            disabled={isLoading}>
                            <View style={styles.optionCardContent}>
                              <View style={[styles.radioButton,
                                editCouncil === council && styles.radioButtonSelected]}>
                                {editCouncil === council &&
                                  <View style={styles.radioButtonInner} />}
                              </View>
                              <Text style={[styles.optionCardText,
                                editCouncil === council && styles.optionCardTextSelected]}>
                                {council}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <CreateField label="Registration Number"
                      value={editRegistrationNumber}
                      onChangeText={setEditRegistrationNumber}
                      placeholder="Registration number" disabled={isLoading} />

                    <Text style={styles.sectionHeading}>Facility Assignment</Text>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Facility</Text>
                      <View style={styles.optionsGrid}>
                        {facilities.map((facility) => (
                          <Pressable key={facility.id}
                            style={[styles.optionCard,
                              editFacility === facility.id && styles.optionCardSelected]}
                            onPress={() => setEditFacility(facility.id)}
                            disabled={isLoading}>
                            <View style={styles.optionCardContent}>
                              <View style={[styles.radioButton,
                                editFacility === facility.id && styles.radioButtonSelected]}>
                                {editFacility === facility.id &&
                                  <View style={styles.radioButtonInner} />}
                              </View>
                              <Text style={[styles.optionCardText,
                                editFacility === facility.id && styles.optionCardTextSelected]}>
                                {facility.name}
                              </Text>
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>Active Status</Text>
                      <View style={styles.optionsGrid}>
                        <Pressable
                          style={[styles.optionCard,
                            editActive && styles.optionCardSelected]}
                          onPress={() => setEditActive(true)}
                          disabled={isLoading}>
                          <View style={styles.optionCardContent}>
                            <View style={[styles.radioButton,
                              editActive && styles.radioButtonSelected]}>
                              {editActive && <View style={styles.radioButtonInner} />}
                            </View>
                            <Text style={[styles.optionCardText,
                              editActive && styles.optionCardTextSelected]}>Active</Text>
                          </View>
                        </Pressable>
                        <Pressable
                          style={[styles.optionCard,
                            !editActive && styles.optionCardSelected]}
                          onPress={() => setEditActive(false)}
                          disabled={isLoading}>
                          <View style={styles.optionCardContent}>
                            <View style={[styles.radioButton,
                              !editActive && styles.radioButtonSelected]}>
                              {!editActive && <View style={styles.radioButtonInner} />}
                            </View>
                            <Text style={[styles.optionCardText,
                              !editActive && styles.optionCardTextSelected]}>Inactive</Text>
                          </View>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable style={styles.cancelButton}
                    onPress={() => setShowEditWorker(false)}
                    disabled={isLoading}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.createButton, isLoading && styles.disabledButton]}
                    onPress={saveWorkerEdits}
                    disabled={isLoading}>
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.loadingText}>Saving...</Text>
                      </View>
                    ) : (
                      <Text style={styles.createButtonText}>Save Changes</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* TOASTS */}
      {successMessage !== '' && (
        <View style={styles.successToast}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}
      {errorMessage !== '' && (
        <View style={styles.errorToast}>
          <View style={styles.errorCircle}>
            <Text style={styles.errorCheck}>!</Text>
          </View>
          <Text style={styles.errorToastText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

/* ============================================================
   SUB-COMPONENTS
============================================================ */

function NavItem({
  icon, label, active, onPress,
}: { icon: string; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.navItem, active && styles.navItemActive]} onPress={onPress}>
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={styles.navText}>{label}</Text>
    </Pressable>
  );
}

function DashboardPage({
  stats, onViewWorker, onGoToStaff,
}: { stats: any; onViewWorker: (w: HealthcareWorker) => void; onGoToStaff: () => void }) {
  const roleEntries = Object.entries(stats.byRole).sort(
    (a: any, b: any) => b[1] - a[1]
  );

  return (
    <View>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>HR Dashboard</Text>
          <Text style={styles.pageSubtitle}>
            Real-time staff statistics from Supabase
          </Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={onGoToStaff}>
          <Text style={styles.primaryButtonText}>Go to Staff</Text>
        </Pressable>
      </View>

      <View style={styles.statCardsRow}>
        <View style={[styles.statCard, styles.statCardTotal]}>
          <Text style={styles.statCardLabel}>Total Workers</Text>
          <Text style={styles.statCardValue}>{stats.total}</Text>
        </View>
        <View style={[styles.statCard, styles.statCardActive]}>
          <Text style={styles.statCardLabel}>Active Workers</Text>
          <Text style={[styles.statCardValue, styles.statCardValueActive]}>
            {stats.active}
          </Text>
        </View>
        <View style={[styles.statCard, styles.statCardInactive]}>
          <Text style={styles.statCardLabel}>Inactive Workers</Text>
          <Text style={[styles.statCardValue, styles.statCardValueInactive]}>
            {stats.inactive}
          </Text>
        </View>
      </View>

      {roleEntries.length > 0 && (
        <View style={[styles.roleStatsCard, { marginTop: 20 }]}>
          <Text style={styles.roleStatsTitle}>Workers by Role</Text>
          <View style={styles.roleStatsGrid}>
            {roleEntries.map(([role, count]: any) => (
              <View key={role} style={styles.roleStatItem}>
                <Text style={styles.roleStatLabel}>{role}</Text>
                <Text style={styles.roleStatValue}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {stats.recent.length > 0 && (
        <View style={[styles.patientCard, { marginTop: 20 }]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Recent Staff</Text>
              <Text style={styles.cardSubtitle}>
                Most recently created workers
              </Text>
            </View>
          </View>
          {stats.recent.map((worker: HealthcareWorker) => (
            <Pressable key={worker.id} style={styles.workerRow}
              onPress={() => onViewWorker(worker)}>
              <View style={styles.workerAvatar}>
                <Text style={styles.workerAvatarText}>
                  {(worker.first_name.charAt(0) || 'W') +
                    (worker.last_name.charAt(0) || '')}
                </Text>
              </View>
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>
                  {worker.first_name} {worker.last_name}
                </Text>
                <Text style={styles.workerMeta}>
                  {worker.role} • {worker.facility || 'No facility'}
                </Text>
              </View>
              <View style={[styles.statusBadge,
                worker.active ? styles.assignedBadge : styles.unassignedBadge]}>
                <View style={[styles.statusDot,
                  worker.active ? styles.assignedDot : styles.unassignedDot]} />
                <Text style={[styles.statusText,
                  worker.active ? styles.assignedText : styles.unassignedText]}>
                  {worker.active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function StaffPage({
  healthcareWorkers,
  totalCount,
  searchQuery,
  setSearchQuery,
  filterRole,
  setFilterRole,
  filterDepartment,
  setFilterDepartment,
  filterEmploymentStatus,
  setFilterEmploymentStatus,
  filterActive,
  setFilterActive,
  availableRoles,
  availableDepartments,
  availableEmploymentStatuses,
  onCreateWorker,
  onView,
  onEdit,
  onToggleActive,
}: any) {
  const hasFilters =
    searchQuery !== '' ||
    filterRole !== '' ||
    filterDepartment !== '' ||
    filterEmploymentStatus !== '' ||
    filterActive !== 'all';

  const clearAll = () => {
    setSearchQuery('');
    setFilterRole('');
    setFilterDepartment('');
    setFilterEmploymentStatus('');
    setFilterActive('all');
  };

  return (
    <View style={styles.workerSection}>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Staff</Text>
          <Text style={styles.pageSubtitle}>
            Manage staff access, departments, and facilities
          </Text>
        </View>
        <Pressable style={styles.primaryButton} onPress={onCreateWorker}>
          <Text style={styles.primaryButtonText}>+ Create Worker</Text>
        </Pressable>
      </View>

      <View style={styles.filterCard}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by first name, last name, staff number, ID or passport number"
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />
        <View style={styles.filterRow}>
          <FilterSelect label="Role" value={filterRole}
            onChange={setFilterRole} options={availableRoles} />
          <FilterSelect label="Department" value={filterDepartment}
            onChange={setFilterDepartment} options={availableDepartments} />
          <FilterSelect label="Employment" value={filterEmploymentStatus}
            onChange={setFilterEmploymentStatus}
            options={availableEmploymentStatuses} />
          <FilterSelect label="Status"
            value={filterActive === 'all' ? '' : filterActive}
            onChange={(v: string) => setFilterActive((v || 'all') as any)}
            options={['active', 'inactive']} />
          {hasFilters && (
            <Pressable style={styles.clearFilterButton} onPress={clearAll}>
              <Text style={styles.clearFilterText}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.patientCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>All Workers</Text>
            <Text style={styles.cardSubtitle}>Active staff roster</Text>
          </View>
          <View style={styles.staffCountBadge}>
            <Text style={styles.staffCountText}>
              {healthcareWorkers.length} / {totalCount}
            </Text>
          </View>
        </View>

        {healthcareWorkers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>♙</Text>
            <Text style={styles.emptyTitle}>
              {totalCount === 0
                ? 'No healthcare workers found'
                : 'No workers match your search or filters'}
            </Text>
            <Text style={styles.emptyText}>
              {totalCount === 0
                ? 'Create a worker profile to manage roles and facilities.'
                : 'Adjust your search or filters to see more results.'}
            </Text>
          </View>
        ) : (
          healthcareWorkers.map((worker: HealthcareWorker) => (
            <View key={worker.id} style={styles.workerRow}>
              <View style={styles.workerAvatar}>
                <Text style={styles.workerAvatarText}>
                  {(worker.first_name.charAt(0) || 'W') +
                    (worker.last_name.charAt(0) || '')}
                </Text>
              </View>

              <Pressable style={styles.workerInfo} onPress={() => onView(worker)}>
                <Text style={styles.workerName}>
                  {worker.first_name} {worker.last_name}
                </Text>
                <Text style={styles.workerMeta}>
                  <Text style={styles.workerMetaStrong}>
                    {worker.staff_number || 'No staff #'}
                  </Text>
                  {'  •  '}
                  <Text style={styles.workerMetaStrong}>
                    {worker.id_number || worker.passport_number || 'No ID/Passport'}
                  </Text>
                </Text>
                <Text style={styles.workerMeta}>
                  {worker.role || 'No role'} • {worker.facility || 'No facility'}
                  {worker.department ? ` • ${worker.department}` : ''}
                </Text>
              </Pressable>

              <View style={styles.rowActions}>
                <Pressable style={styles.iconButton} onPress={() => onView(worker)}>
                  <Text style={styles.iconButtonText}>View</Text>
                </Pressable>
                <Pressable style={styles.iconButton} onPress={() => onEdit(worker)}>
                  <Text style={styles.iconButtonText}>Edit</Text>
                </Pressable>
                <Pressable
                  style={[styles.iconButton,
                    worker.active ? styles.iconButtonWarning : styles.iconButtonSuccess]}
                  onPress={() => onToggleActive(worker, !worker.active)}>
                  <Text style={[styles.iconButtonText,
                    worker.active
                      ? styles.iconButtonTextWarning
                      : styles.iconButtonTextSuccess]}>
                    {worker.active ? 'Deactivate' : 'Activate'}
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.statusBadge,
                worker.active ? styles.assignedBadge : styles.unassignedBadge]}>
                <View style={[styles.statusDot,
                  worker.active ? styles.assignedDot : styles.unassignedDot]} />
                <Text style={[styles.statusText,
                  worker.active ? styles.assignedText : styles.unassignedText]}>
                  {worker.active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function FacilitiesPage({
  facilities,
  healthcareWorkers,
}: {
  facilities: { id: string; name: string }[];
  healthcareWorkers: HealthcareWorker[];
}) {
  return (
    <View>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Facilities</Text>
          <Text style={styles.pageSubtitle}>
            Current facility assignments from Supabase
          </Text>
        </View>
      </View>

      {facilities.length === 0 ? (
        <View style={styles.patientCard}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⌂</Text>
            <Text style={styles.emptyTitle}>No facilities found</Text>
            <Text style={styles.emptyText}>
              Facilities from the database will appear here.
            </Text>
          </View>
        </View>
      ) : (
        facilities.map((f) => {
          const assigned = healthcareWorkers.filter(
            (w) => w.facility_id === f.id
          );
          const activeCount = assigned.filter((w) => w.active).length;
          return (
            <View key={f.id} style={styles.patientCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>{f.name}</Text>
                  <Text style={styles.cardSubtitle}>
                    {assigned.length} assigned • {activeCount} active
                  </Text>
                </View>
                <View style={styles.staffCountBadge}>
                  <Text style={styles.staffCountText}>{assigned.length}</Text>
                </View>
              </View>
              {assigned.length === 0 ? (
                <Text style={styles.emptyText}>
                  No workers assigned to this facility.
                </Text>
              ) : (
                assigned.map((w) => (
                  <View key={w.id} style={styles.workerRow}>
                    <View style={styles.workerAvatar}>
                      <Text style={styles.workerAvatarText}>
                        {(w.first_name.charAt(0) || 'W') +
                          (w.last_name.charAt(0) || '')}
                      </Text>
                    </View>
                    <View style={styles.workerInfo}>
                      <Text style={styles.workerName}>
                        {w.first_name} {w.last_name}
                      </Text>
                      <Text style={styles.workerMeta}>
                        {w.role}
                        {w.department ? ` • ${w.department}` : ''}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge,
                      w.active ? styles.assignedBadge : styles.unassignedBadge]}>
                      <View style={[styles.statusDot,
                        w.active ? styles.assignedDot : styles.unassignedDot]} />
                      <Text style={[styles.statusText,
                        w.active ? styles.assignedText : styles.unassignedText]}>
                        {w.active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

function ProfilePage({ profileInfo }: { profileInfo: any }) {
  if (!profileInfo) {
    return (
      <View style={styles.patientCard}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>◉</Text>
          <Text style={styles.emptyTitle}>No profile information</Text>
          <Text style={styles.emptyText}>
            Your profile will appear here once available.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>My Profile</Text>
          <Text style={styles.pageSubtitle}>
            Your account information from Supabase
          </Text>
        </View>
      </View>

      <DetailSection title="Personal Information" rows={[
        ['First Name', profileInfo.first_name],
        ['Last Name', profileInfo.last_name],
        ['Email', profileInfo.email],
        ['Phone', profileInfo.phone],
        ['ID Number', profileInfo.id_number],
        ['Passport Number', profileInfo.passport_number],
        ['Address', profileInfo.address],
      ]} />

      <View style={{ height: 16 }} />

      <DetailSection title="Employment Information" rows={[
        ['Role', profileInfo.role],
        ['Staff Number', profileInfo.staff_number],
        ['Employment Status', profileInfo.employment_status],
        ['Healthcare Role', profileInfo.healthcare_role],
        ['Department', profileInfo.department],
        ['Facility', profileInfo.facility],
        ['Start Date', profileInfo.start_date],
        ['End Date', profileInfo.end_date],
      ]} />
    </View>
  );
}

function SettingsPage() {
  return (
    <View>
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.pageSubtitle}>Application preferences</Text>
        </View>
      </View>
      <View style={styles.patientCard}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⚙</Text>
          <Text style={styles.emptyTitle}>Settings</Text>
          <Text style={styles.emptyText}>
            Settings options will be added in a future release.
          </Text>
        </View>
      </View>
    </View>
  );
}

function CreateField({
  label, required, value, onChangeText, placeholder, keyboardType,
  secureTextEntry, multiline, autoCapitalize, error, disabled,
}: {
  label: string; required?: boolean; value: string;
  onChangeText: (t: string) => void; placeholder?: string;
  keyboardType?: any; secureTextEntry?: boolean; multiline?: boolean;
  autoCapitalize?: any; error?: string; disabled?: boolean;
}) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredStar}>*</Text>}
      </Text>
      <TextInput
        selectTextOnFocus={false}
        autoCorrect={false}
        spellCheck={false}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'auto'}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError,
        ]}
        editable={!disabled}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.filterSelectWrap}>
      <Text style={styles.filterLabel}>{label}</Text>
      <Pressable style={styles.filterSelect} onPress={() => setOpen(!open)}>
        <Text style={value ? styles.filterSelectText : styles.filterSelectPlaceholder}>
          {value ? value : 'All'}
        </Text>
        <Text style={styles.filterChevron}>⌄</Text>
      </Pressable>
      {open && (
        <View style={styles.filterDropdown}>
          <Pressable style={styles.filterOption}
            onPress={() => { onChange(''); setOpen(false); }}>
            <Text style={styles.filterOptionText}>All</Text>
          </Pressable>
          {options.map((opt) => (
            <Pressable key={opt} style={styles.filterOption}
              onPress={() => { onChange(opt); setOpen(false); }}>
              <Text style={styles.filterOptionText}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function DetailSection({
  title, rows,
}: { title: string; rows: [string, string | null | undefined][] }) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{title}</Text>
      {rows.map(([label, value]) => (
        <View key={label} style={styles.detailRow}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>
            {value && String(value).trim() !== '' ? String(value) : '—'}
          </Text>
        </View>
      ))}
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */
const styles = StyleSheet.create({
  appContainer: { flex: 1, flexDirection: 'row', backgroundColor: '#F8FAFC' },

  sidebar: {
    width: 245, backgroundColor: '#0F2A43',
    paddingVertical: 24, paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  sidebarCollapsed: { width: 82, paddingHorizontal: 12 },

  logoArea: { alignItems: 'center', marginBottom: 30 },
  governmentLogo: { width: 70, height: 70, marginBottom: 10 },
  governmentLogoCollapsed: { width: 55, height: 55, marginTop: 8 },
  logoTextArea: { alignItems: 'center' },
  carelinkText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  logoSubtitle: { color: '#CBD5E1', fontSize: 10, marginTop: 3 },
  departmentText: { color: '#94A3B8', fontSize: 9, marginTop: 5 },

  sidebarMenu: { flex: 1 },
  menuLabel: {
    color: '#64748B', fontSize: 9, fontWeight: '800',
    letterSpacing: 1, marginLeft: 12, marginBottom: 8,
  },
  navDivider: {
    height: 1, backgroundColor: '#1E3A56',
    marginVertical: 15, marginHorizontal: 8,
  },
  navItem: {
    height: 45, borderRadius: 8, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 12, marginBottom: 4,
  },
  navItemActive: { backgroundColor: '#1D4ED8' },
  navIcon: { width: 28, color: '#94A3B8', fontSize: 18, textAlign: 'center' },
  navText: { color: '#CBD5E1', fontSize: 13, marginLeft: 3 },

  sidebarFooter: { borderTopWidth: 1, borderTopColor: '#1E3A56', paddingTop: 15 },
  secureText: { color: '#94A3B8', fontSize: 9, textAlign: 'center' },
  versionText: { color: '#64748B', fontSize: 8, textAlign: 'center', marginTop: 5 },

  main: { flex: 1, minWidth: 0 },

  header: {
    height: 76, backgroundColor: '#FFFFFF', borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0', paddingHorizontal: 28,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  menuButton: {
    width: 42, height: 42, borderRadius: 8, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  menuButtonText: { color: '#0F2A43', fontSize: 24, fontWeight: '600' },
  headerTitle: { color: '#0F2A43', fontSize: 17, fontWeight: '800' },
  headerSubtitle: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  notificationButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
    marginRight: 18,
  },
  notificationIcon: { color: '#475569', fontSize: 19 },
  notificationBadge: {
    position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16,
    borderRadius: 8, backgroundColor: '#DC2626',
    justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  profileMini: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  avatarText: { color: '#2563EB', fontSize: 15, fontWeight: '800' },
  profileName: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  profileRole: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  chevron: { color: '#94A3B8', fontSize: 17, marginLeft: 9 },

  scrollView: { flex: 1 },
  content: { padding: 30, paddingBottom: 50 },

  pageHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  pageTitle: { color: '#0F172A', fontSize: 25, fontWeight: '700' },
  pageSubtitle: { color: '#64748B', fontSize: 13, marginTop: 5 },
  primaryButton: {
    backgroundColor: '#1D4ED8', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 8, shadowColor: '#1D4ED8', shadowOpacity: 0.15,
    shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  patientCard: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 11, padding: 20, marginBottom: 20,
  },
  workerSection: { gap: 18 },
  workerRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  workerAvatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#DBEAFE',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  workerAvatarText: { color: '#1D4ED8', fontSize: 12, fontWeight: '800' },
  workerInfo: { flex: 1 },
  workerName: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  workerMeta: { color: '#64748B', fontSize: 10, marginTop: 3 },
  workerMetaStrong: { color: '#334155', fontWeight: '700' },

  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 18,
  },
  cardTitle: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
  cardSubtitle: { color: '#94A3B8', fontSize: 10, marginTop: 3 },
  staffCountBadge: {
    backgroundColor: '#EFF6FF', paddingHorizontal: 12,
    paddingVertical: 4, borderRadius: 12,
  },
  staffCountText: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 45 },
  emptyIcon: { fontSize: 30, color: '#94A3B8' },
  emptyTitle: { color: '#334155', fontSize: 13, fontWeight: '700', marginTop: 8 },
  emptyText: { color: '#94A3B8', fontSize: 10, marginTop: 4, textAlign: 'center' },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
  },
  assignedBadge: { backgroundColor: '#ECFDF5' },
  unassignedBadge: { backgroundColor: '#FFF7ED' },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  assignedDot: { backgroundColor: '#059669' },
  unassignedDot: { backgroundColor: '#EA580C' },
  statusText: { fontSize: 10, fontWeight: '700' },
  assignedText: { color: '#047857' },
  unassignedText: { color: '#C2410C' },

  footer: { alignItems: 'center', marginTop: 30 },
  footerText: { color: '#94A3B8', fontSize: 9, marginBottom: 3 },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1, width: '100%',
    justifyContent: 'center', alignItems: 'center',
  },
  modalContainer: { width: '100%', maxWidth: 580, maxHeight: '90%' },
  modal: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', padding: 24, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC',
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  modalIconContainer: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  modalIcon: { fontSize: 20 },
  modalTitle: { color: '#0F172A', fontSize: 18, fontWeight: '700' },
  modalSubtitle: { color: '#64748B', fontSize: 12, marginTop: 2 },
  modalCloseButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9',
    justifyContent: 'center', alignItems: 'center', marginLeft: 12,
  },
  closeButton: { color: '#64748B', fontSize: 22, lineHeight: 22, fontWeight: '600' },
  modalScrollView: { maxHeight: 500 },
  modalScrollContent: { padding: 24, paddingBottom: 30 },
  modalPrivacyNotice: {
    flexDirection: 'row', backgroundColor: '#F0FDF4', borderWidth: 1,
    borderColor: '#BBF7D0', borderRadius: 10, padding: 14, marginBottom: 20,
  },
  privacyIconContainer: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#DCFCE7',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  privacyIcon: { fontSize: 16 },
  privacyContent: { flex: 1 },
  modalPrivacyTitle: { color: '#166534', fontSize: 12, fontWeight: '700' },
  modalPrivacyText: { color: '#14532D', fontSize: 11, lineHeight: 16, marginTop: 2 },

  formSection: { gap: 16 },
  formGroup: { marginBottom: 4 },
  inputLabel: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  requiredStar: { color: '#DC2626' },
  input: {
    height: 46, borderWidth: 1.5, borderColor: '#CBD5E1',
    borderRadius: 8, paddingHorizontal: 14, color: '#0F172A',
    fontSize: 13, backgroundColor: '#FFFFFF',
  },
  multilineInput: { height: 80, paddingTop: 12 },
  inputError: { borderColor: '#DC2626', borderWidth: 2 },
  errorText: { color: '#DC2626', fontSize: 11, marginTop: 4 },

  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionCard: {
    flex: 1, minWidth: '45%', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 8, padding: 12, backgroundColor: '#FFFFFF',
  },
  optionCardSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  optionCardContent: { flexDirection: 'row', alignItems: 'center' },
  radioButton: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    borderColor: '#94A3B8', justifyContent: 'center',
    alignItems: 'center', marginRight: 10,
  },
  radioButtonSelected: { borderColor: '#2563EB' },
  radioButtonInner: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#2563EB',
  },
  optionCardText: { color: '#475569', fontSize: 12, fontWeight: '600', flex: 1 },
  optionCardTextSelected: { color: '#1D4ED8' },

  modalFooter: {
    flexDirection: 'row', justifyContent: 'flex-end', padding: 20,
    borderTopWidth: 1, borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC', gap: 10, flexWrap: 'wrap',
  },
  cancelButton: {
    borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 12, minWidth: 100, alignItems: 'center',
  },
  cancelButtonText: { color: '#475569', fontSize: 13, fontWeight: '700' },
  createButton: {
    backgroundColor: '#1D4ED8', borderRadius: 8, paddingHorizontal: 24,
    paddingVertical: 12, minWidth: 120, alignItems: 'center',
    shadowColor: '#1D4ED8', shadowOpacity: 0.2, shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  disabledButton: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
  createButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  statCardsRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  statCard: {
    flex: 1, minWidth: 160, backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 11, padding: 18,
  },
  statCardTotal: { borderLeftWidth: 4, borderLeftColor: '#1D4ED8' },
  statCardActive: { borderLeftWidth: 4, borderLeftColor: '#059669' },
  statCardInactive: { borderLeftWidth: 4, borderLeftColor: '#EA580C' },
  statCardLabel: {
    color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 0.5,
  },
  statCardValue: { color: '#0F172A', fontSize: 28, fontWeight: '800', marginTop: 6 },
  statCardValueActive: { color: '#059669' },
  statCardValueInactive: { color: '#EA580C' },

  roleStatsCard: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 11, padding: 18,
  },
  roleStatsTitle: {
    color: '#0F172A', fontSize: 13, fontWeight: '700', marginBottom: 12,
  },
  roleStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleStatItem: {
    minWidth: 110, backgroundColor: '#F8FAFC', borderWidth: 1,
    borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: 12,
  },
  roleStatLabel: {
    color: '#334155', fontSize: 12, fontWeight: '600', textTransform: 'capitalize',
  },
  roleStatValue: { color: '#1D4ED8', fontSize: 14, fontWeight: '800' },

  filterCard: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 11, padding: 16, marginBottom: 20, gap: 12,
  },
  searchInput: {
    height: 46, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 8,
    paddingHorizontal: 14, color: '#0F172A', fontSize: 13,
    backgroundColor: '#FFFFFF', width: '100%',
  },
  filterRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' },
  filterSelectWrap: { minWidth: 150, flex: 1, position: 'relative' },
  filterLabel: { color: '#334155', fontSize: 11, fontWeight: '700', marginBottom: 5 },
  filterSelect: {
    height: 40, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 8,
    paddingHorizontal: 12, backgroundColor: '#FFFFFF',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  filterSelectText: {
    color: '#0F172A', fontSize: 12, fontWeight: '600', textTransform: 'capitalize',
  },
  filterSelectPlaceholder: { color: '#94A3B8', fontSize: 12 },
  filterChevron: { color: '#64748B', fontSize: 14 },
  filterDropdown: {
    position: 'absolute', top: 66, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 8, paddingVertical: 6, zIndex: 50,
    shadowColor: '#000000', shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 4, maxHeight: 200,
  },
  filterOption: { paddingHorizontal: 12, paddingVertical: 8 },
  filterOptionText: { color: '#334155', fontSize: 12, textTransform: 'capitalize' },
  clearFilterButton: {
    height: 40, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1.5,
    borderColor: '#CBD5E1', justifyContent: 'center',
    alignItems: 'center', backgroundColor: '#F8FAFC',
  },
  clearFilterText: { color: '#475569', fontSize: 12, fontWeight: '700' },

  rowActions: { flexDirection: 'row', gap: 6, marginRight: 12 },
  iconButton: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6,
    borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF',
  },
  iconButtonText: { color: '#334155', fontSize: 11, fontWeight: '700' },
  iconButtonWarning: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
  iconButtonSuccess: { borderColor: '#6EE7B7', backgroundColor: '#ECFDF5' },
  iconButtonTextWarning: { color: '#B91C1C' },
  iconButtonTextSuccess: { color: '#047857' },

  deactivateButton: { backgroundColor: '#DC2626' },
  activateButton: { backgroundColor: '#059669' },

  sectionHeading: {
    color: '#0F172A', fontSize: 13, fontWeight: '800',
    marginTop: 10, marginBottom: 4, letterSpacing: 0.5,
  },

  detailSections: { gap: 20 },
  detailSection: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, padding: 16, marginBottom: 16,
  },
  detailSectionTitle: {
    color: '#1D4ED8', fontSize: 12, fontWeight: '800',
    marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9', gap: 12,
  },
  detailLabel: { color: '#64748B', fontSize: 11, fontWeight: '600', flex: 1 },
  detailValue: {
    color: '#0F172A', fontSize: 11, fontWeight: '700',
    flex: 2, textAlign: 'right',
  },

  errorToast: {
    position: 'absolute', top: 92, right: 25, maxWidth: 360,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000000', shadowOpacity: 0.1, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  errorCircle: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#FEE2E2',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  errorCheck: { color: '#DC2626', fontSize: 16, fontWeight: '800' },
  errorToastText: { color: '#991B1B', fontSize: 12, fontWeight: '600', flex: 1 },

  successToast: {
    position: 'absolute', top: 92, right: 25, maxWidth: 360,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#A7F3D0',
    borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000000', shadowOpacity: 0.1, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  successCircle: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#D1FAE5',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  successCheck: { color: '#059669', fontSize: 16, fontWeight: '800' },
  successText: { color: '#065F46', fontSize: 12, fontWeight: '600', flex: 1 },
});