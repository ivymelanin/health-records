import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { isValidSouthAfricanId } from '../../utils/saIdValidator';

type Patient = {
  id: string;
  file_number: string | null;
  id_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone_number: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  biometric_enrolled: boolean;
  biometric_enrolled_at: string | null;
  identity_verified: boolean;
  created: string;
};

type PatientEncounter = {
  id: string;
  patient_id: string;
  facility_id: string;
  healthcare_worker_id: string | null;
  department: string | null;
  reason: string | null;
  status: string;
  check_in_at: string;
  check_out_at: string | null;
  created_at: string;
  facility_name: string;
  healthcare_worker_name: string;
};

type Facility = {
  id: string;
  name: string;
};

export default function PatientsScreen() {
  const { session, loading: authLoading } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  // Search-by-ID state
  const [idNumber, setIdNumber] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Patient list state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Patient file modal
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientEncounters, setPatientEncounters] = useState<PatientEncounter[]>([]);
  const [loadingPatientFile, setLoadingPatientFile] = useState(false);
  const [showPatientFile, setShowPatientFile] = useState(false);

  // Edit modal
  const [showEditPatient, setShowEditPatient] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');

  // Start encounter modal
  const [showStartEncounter, setShowStartEncounter] = useState(false);
  const [encounterFacility, setEncounterFacility] = useState('');
  const [encounterDepartment, setEncounterDepartment] = useState('');
  const [encounterReason, setEncounterReason] = useState('');
  const [facilities, setFacilities] = useState<Facility[]>([]);

  // Toast
  const [successMessage, setSuccessMessage] = useState('');

  // =========================================
  // FETCH ALL PATIENTS
  // =========================================

  const fetchPatients = async () => {
    try {
      setRefreshing(true);

      const { data, error } = await supabase
        .from('patients')
        .select(`
          id, file_number, id_number, first_name, last_name,
          date_of_birth, gender, phone_number, address,
          emergency_contact_name, emergency_contact_phone,
          biometric_enrolled, biometric_enrolled_at,
          identity_verified, created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPatients((data ?? []).map((p: any) => ({
        id: p.id,
        file_number: p.file_number,
        id_number: p.id_number,
        first_name: p.first_name,
        last_name: p.last_name,
        date_of_birth: p.date_of_birth,
        gender: p.gender,
        phone_number: p.phone_number,
        address: p.address,
        emergency_contact_name: p.emergency_contact_name,
        emergency_contact_phone: p.emergency_contact_phone,
        biometric_enrolled: p.biometric_enrolled ?? false,
        biometric_enrolled_at: p.biometric_enrolled_at,
        identity_verified: p.identity_verified ?? false,
        created: new Date(p.created_at).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
        }),
      })));
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================
  // HOOKS (must run before early returns)
  // =========================================

  useEffect(() => {
    if (session) fetchPatients();
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const loadFacilities = async () => {
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('id, name')
          .order('name', { ascending: true });
        if (error) throw error;
        setFacilities(data ?? []);
      } catch (error) {
        console.error('Error fetching facilities:', error);
      }
    };
    loadFacilities();
  }, [session]);

  // =========================================
  // EARLY RETURNS
  // =========================================

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  // =========================================
  // SEARCH BY ID (top search box)
  // =========================================

  const searchPatientById = async () => {
    const cleanId = idNumber.replace(/\s/g, '');
    if (!cleanId) {
      Alert.alert('ID number required', 'Please enter the patient’s 13-digit South African ID number.');
      return;
    }
    if (cleanId.length !== 13) {
      Alert.alert('Invalid ID number', 'A South African ID number must contain exactly 13 digits.');
      return;
    }
    if (!isValidSouthAfricanId(cleanId)) {
      Alert.alert('Invalid ID number', 'The ID number entered is not a valid South African ID number.');
      return;
    }

    try {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id, file_number, id_number, first_name, last_name,
          date_of_birth, gender, phone_number, address,
          emergency_contact_name, emergency_contact_phone,
          biometric_enrolled, biometric_enrolled_at,
          identity_verified, created_at
        `)
        .eq('id_number', cleanId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        Alert.alert('Patient not found', 'No patient record was found with that ID number.');
        return;
      }

      const mapped: Patient = {
        id: data.id,
        file_number: data.file_number,
        id_number: data.id_number,
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        phone_number: data.phone_number,
        address: data.address,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        biometric_enrolled: data.biometric_enrolled ?? false,
        biometric_enrolled_at: data.biometric_enrolled_at,
        identity_verified: data.identity_verified ?? false,
        created: new Date(data.created_at).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
        }),
      };

      await openPatientFile(mapped);
    } catch (err) {
      console.error('SEARCH ERROR:', err);
      Alert.alert('Search error', 'Unable to search patient records right now.');
    } finally {
      setSearchLoading(false);
    }
  };

  // =========================================
  // OPEN PATIENT FILE
  // =========================================

  const openPatientFile = async (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientFile(true);
    setLoadingPatientFile(true);
    setPatientEncounters([]);

    try {
      const { data: encounters, error } = await supabase
        .from('patient_encounters')
        .select(`
          id, patient_id, facility_id, healthcare_worker_id,
          department, reason, status, check_in_at, check_out_at,
          created_at, facilities (name)
        `)
        .eq('patient_id', patient.id)
        .order('check_in_at', { ascending: false });

      if (error) throw error;

      const workerIds = [...new Set((encounters ?? []).map((e: any) => e.healthcare_worker_id).filter(Boolean))];
      let workerMap = new Map<string, { first_name: string | null; last_name: string | null }>();

      if (workerIds.length > 0) {
        const { data: workers, error: workersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', workerIds);
        if (workersError) throw workersError;
        workerMap = new Map((workers ?? []).map((w) => [w.id, { first_name: w.first_name, last_name: w.last_name }]));
      }

      setPatientEncounters((encounters ?? []).map((encounter: any) => {
        const worker = encounter.healthcare_worker_id
          ? workerMap.get(encounter.healthcare_worker_id)
          : null;
        const workerName = worker
          ? `${worker.first_name ?? ''} ${worker.last_name ?? ''}`.trim()
          : 'Awaiting Healthcare Worker';

        return {
          id: encounter.id,
          patient_id: encounter.patient_id,
          facility_id: encounter.facility_id,
          healthcare_worker_id: encounter.healthcare_worker_id,
          department: encounter.department,
          reason: encounter.reason,
          status: encounter.status,
          check_in_at: encounter.check_in_at,
          check_out_at: encounter.check_out_at,
          created_at: encounter.created_at,
          facility_name: encounter.facilities?.name ?? 'Unknown facility',
          healthcare_worker_name: workerName,
        };
      }));
    } catch (error) {
      console.error('Error loading patient file:', error);
      setSuccessMessage('Unable to load patient file information.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } finally {
      setLoadingPatientFile(false);
    }
  };

  // =========================================
  // VERIFY IDENTITY
  // =========================================

  const verifyPatientIdentity = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .update({ identity_verified: true, updated_at: new Date().toISOString() })
        .eq('id', patientId);
      if (error) throw error;

      await fetchPatients();
      if (selectedPatient) {
        setSelectedPatient({ ...selectedPatient, identity_verified: true });
      }

      setSuccessMessage('Patient identity verified successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error verifying identity:', error);
      setSuccessMessage('Unable to verify identity. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  // =========================================
  // ENROLL BIOMETRIC
  // =========================================

  const enrollBiometric = async (patientId: string) => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('patients')
        .update({ biometric_enrolled: true, biometric_enrolled_at: now, updated_at: now })
        .eq('id', patientId);
      if (error) throw error;

      await fetchPatients();
      if (selectedPatient) {
        setSelectedPatient({
          ...selectedPatient,
          biometric_enrolled: true,
          biometric_enrolled_at: now,
        });
      }

      setSuccessMessage('Biometric enrollment completed successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error enrolling biometric:', error);
      setSuccessMessage('Unable to enroll biometric. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  // =========================================
  // START ENCOUNTER
  // =========================================

  const openStartEncounter = async (patient: Patient) => {
    try {
      const { data: active } = await supabase
        .from('patient_encounters')
        .select('id')
        .eq('patient_id', patient.id)
        .eq('status', 'active')
        .maybeSingle();

      if (active) {
        setSuccessMessage('Patient already has an active encounter.');
        setTimeout(() => setSuccessMessage(''), 5000);
        return;
      }
    } catch (err) {
      console.error(err);
    }

    setSelectedPatient(patient);
    setShowStartEncounter(true);
    setEncounterFacility('');
    setEncounterDepartment('');
    setEncounterReason('');
  };

  const createEncounter = async () => {
    if (!selectedPatient || !encounterFacility || !encounterReason.trim()) {
      setSuccessMessage('Please select a facility and enter a reason for visit.');
      setTimeout(() => setSuccessMessage(''), 5000);
      return;
    }

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('patient_encounters')
        .insert({
          patient_id: selectedPatient.id,
          facility_id: encounterFacility,
          healthcare_worker_id: null,
          department: encounterDepartment.trim() || null,
          reason: encounterReason.trim(),
          status: 'active',
          check_in_at: now,
          created_at: now,
        });
      if (error) throw error;

      setShowStartEncounter(false);
      await openPatientFile(selectedPatient);
      setSuccessMessage('Encounter started successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error creating encounter:', error);
      setSuccessMessage('Unable to start encounter. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  // =========================================
  // EDIT PATIENT
  // =========================================

  const openEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setEditFirstName(patient.first_name);
    setEditLastName(patient.last_name);
    setEditPhone(patient.phone_number || '');
    setEditAddress(patient.address || '');
    setEditEmergencyName(patient.emergency_contact_name || '');
    setEditEmergencyPhone(patient.emergency_contact_phone || '');
    setShowEditPatient(true);
  };

  const savePatientEdit = async () => {
    if (!editingPatient) return;
    if (!editFirstName.trim() || !editLastName.trim()) {
      setSuccessMessage('First name and last name are required.');
      setTimeout(() => setSuccessMessage(''), 5000);
      return;
    }

    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('patients')
        .update({
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          phone_number: editPhone.trim() || null,
          address: editAddress.trim() || null,
          emergency_contact_name: editEmergencyName.trim() || null,
          emergency_contact_phone: editEmergencyPhone.trim() || null,
          updated_at: now,
        })
        .eq('id', editingPatient.id);
      if (error) throw error;

      setShowEditPatient(false);
      setEditingPatient(null);
      await fetchPatients();
      if (selectedPatient) await openPatientFile(selectedPatient);

      setSuccessMessage('Patient information updated successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error updating patient:', error);
      setSuccessMessage('Unable to update patient information. Please try again.');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  // =========================================
  // FILTERS
  // =========================================

  const filteredPatients = patients.filter((p) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.file_number ?? '').toLowerCase().includes(q) ||
      p.id_number.toLowerCase().includes(q) ||
      p.first_name.toLowerCase().includes(q) ||
      p.last_name.toLowerCase().includes(q)
    );
  });

  const biometricEnrolledCount = patients.filter((p) => p.biometric_enrolled).length;
  const unverifiedCount = patients.filter((p) => !p.identity_verified).length;

  // =========================================
  // PAGE
  // =========================================

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>CARELINK</Text>
        <Text style={styles.systemText}>Electronic Health Records</Text>
      </View>

      <Text style={styles.title}>Patient Records</Text>
      <Text style={styles.description}>
        Search by ID or browse the full patient directory. Tap a patient to open their file.
      </Text>

      {/* SEARCH BY ID */}
      <Text style={styles.inputLabel}>South African ID Number</Text>

      <TextInput
        style={[styles.input, searchLoading && styles.inputDisabled]}
        placeholder="Enter 13-digit ID number"
        placeholderTextColor="#94a3b8"
        value={idNumber}
        onChangeText={(text) => {
          const numbersOnly = text.replace(/[^0-9]/g, '');
          setIdNumber(numbersOnly.slice(0, 13));
        }}
        keyboardType="number-pad"
        maxLength={13}
        editable={!searchLoading}
      />

      <View style={styles.inputFooter}>
        <Text style={styles.helperText}>Enter exactly 13 digits</Text>
        <Text style={styles.characterCount}>{idNumber.length}/13</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, searchLoading && styles.disabledButton]}
        onPress={searchPatientById}
        disabled={searchLoading}
        activeOpacity={0.8}
      >
        {searchLoading ? (
          <>
            <ActivityIndicator color="#ffffff" />
            <Text style={styles.loadingButtonText}>Searching...</Text>
          </>
        ) : (
          <Text style={styles.buttonText}>Search Patient</Text>
        )}
      </TouchableOpacity>

      {idNumber !== '' && !searchLoading && (
        <Pressable style={styles.clearButton} onPress={() => setIdNumber('')}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </Pressable>
      )}

      {/* STATS */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="people" size={20} color="#2563EB" />
          </View>
          <Text style={styles.statNumber}>{patients.length}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="checkmark-circle" size={20} color="#059669" />
          </View>
          <Text style={styles.statNumber}>{patients.length - unverifiedCount}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#F5F3FF' }]}>
            <Ionicons name="finger-print" size={20} color="#7C3AED" />
          </View>
          <Text style={styles.statNumber}>{biometricEnrolledCount}</Text>
          <Text style={styles.statLabel}>Biometric</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
          </View>
          <Text style={styles.statNumber}>{unverifiedCount}</Text>
          <Text style={styles.statLabel}>Unverified</Text>
        </View>
      </View>

      {/* PATIENT LIST */}
      <View style={styles.directorySection}>
        <View style={styles.directoryHeader}>
          <Text style={styles.directoryTitle}>Patient Directory</Text>
          <Text style={styles.directoryCount}>{filteredPatients.length}</Text>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by file number, ID, first or last name..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
          />
        </View>

        {refreshing && patients.length === 0 ? (
          <View style={styles.directoryLoading}>
            <ActivityIndicator color="#2563eb" />
            <Text style={styles.directoryLoadingText}>Loading patients...</Text>
          </View>
        ) : filteredPatients.length === 0 ? (
          <View style={styles.directoryEmpty}>
            <Text style={styles.directoryEmptyTitle}>No patient files found</Text>
            <Text style={styles.directoryEmptyText}>
              {search ? 'Try a different search term.' : 'No patients registered yet.'}
            </Text>
          </View>
        ) : (
          filteredPatients.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.directoryItem}
              activeOpacity={0.7}
              onPress={() => openPatientFile(p)}
            >
              <View style={styles.directoryAvatar}>
                <Text style={styles.directoryAvatarText}>
                  {p.first_name?.charAt(0)?.toUpperCase() ?? '?'}
                  {p.last_name?.charAt(0)?.toUpperCase() ?? ''}
                </Text>
              </View>

              <View style={styles.directoryInfo}>
                <Text style={styles.directoryName}>
                  {p.first_name} {p.last_name}
                </Text>
                <Text style={styles.directoryId}>
                  {p.file_number ? `File: ${p.file_number}  •  ` : ''}ID: {p.id_number}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, p.biometric_enrolled ? styles.badgeGreen : styles.badgeOrange]}>
                    <Text style={[styles.badgeText, p.biometric_enrolled ? styles.badgeTextGreen : styles.badgeTextOrange]}>
                      {p.biometric_enrolled ? 'Biometric' : 'No Biometric'}
                    </Text>
                  </View>
                  <View style={[styles.badge, p.identity_verified ? styles.badgeGreen : styles.badgeRed]}>
                    <Text style={[styles.badgeText, p.identity_verified ? styles.badgeTextGreen : styles.badgeTextRed]}>
                      {p.identity_verified ? 'Verified' : 'Unverified'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.directoryArrow}>→</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* SECURITY MESSAGE */}
      <View style={styles.securityMessage}>
        <Text style={styles.securityIcon}>🔒</Text>
        <View style={styles.securityContent}>
          <Text style={styles.securityTitle}>Patient information is protected</Text>
          <Text style={styles.securityText}>
            Only authorized healthcare workers should access patient records.
          </Text>
        </View>
      </View>

      {/* ========================================= */}
      {/* PATIENT FILE MODAL */}
      {/* ========================================= */}
      <Modal visible={showPatientFile} transparent animationType="fade" onRequestClose={() => setShowPatientFile(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.patientFileModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Patient File</Text>
                <Text style={styles.modalSubtitle}>Patient identification and encounter history</Text>
              </View>
              <Pressable onPress={() => setShowPatientFile(false)}>
                <Ionicons name="close" size={28} color="#64748B" />
              </Pressable>
            </View>

            {selectedPatient && (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.patientFileScroll}>
                <View style={styles.patientFileHeader}>
                  <View style={styles.patientFileIcon}>
                    <Text style={styles.patientFileIconText}>
                      {selectedPatient.first_name?.charAt(0)?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  <View style={styles.patientFileHeaderInfo}>
                    <Text style={styles.patientFileName}>
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </Text>
                    <Text style={styles.patientFileNumber}>
                      {selectedPatient.file_number ?? 'File Number Not Assigned'}
                    </Text>
                  </View>
                </View>

                <View style={styles.fileSection}>
                  <Text style={styles.fileSectionTitle}>Patient Information</Text>
                  <View style={styles.fileGrid}>
                    <PatientFileField label="ID NUMBER" value={selectedPatient.id_number} />
                    <PatientFileField
                      label="DATE OF BIRTH"
                      value={selectedPatient.date_of_birth
                        ? new Date(`${selectedPatient.date_of_birth}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Not provided'}
                    />
                    <PatientFileField label="GENDER" value={selectedPatient.gender ?? 'Not provided'} />
                    <PatientFileField label="PHONE" value={selectedPatient.phone_number ?? 'Not provided'} />
                    <PatientFileField label="ADDRESS" value={selectedPatient.address ?? 'Not provided'} />
                    <PatientFileField label="REGISTERED" value={selectedPatient.created} />
                  </View>
                </View>

                <View style={styles.fileSection}>
                  <Text style={styles.fileSectionTitle}>Emergency Contact</Text>
                  <View style={styles.emergencyCard}>
                    <Text style={styles.emergencyName}>
                      {selectedPatient.emergency_contact_name ?? 'Not provided'}
                    </Text>
                    <Text style={styles.emergencyPhone}>
                      {selectedPatient.emergency_contact_phone ?? 'No phone number provided'}
                    </Text>
                  </View>
                </View>

                <View style={styles.fileSection}>
                  <Text style={styles.fileSectionTitle}>Identity & Biometric</Text>
                  <View style={styles.fileGrid}>
                    <PatientFileField
                      label="IDENTITY VERIFIED"
                      value={selectedPatient.identity_verified ? '✅ Verified' : '❌ Not Verified'}
                    />
                    <PatientFileField
                      label="BIOMETRIC ENROLLMENT"
                      value={selectedPatient.biometric_enrolled
                        ? `✅ Enrolled${selectedPatient.biometric_enrolled_at ? ' on ' + new Date(selectedPatient.biometric_enrolled_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}`
                        : '❌ Not Enrolled'}
                    />
                  </View>
                </View>

                <View style={styles.actionButtonsContainer}>
                  <Pressable style={[styles.actionBtn, styles.editBtn]} onPress={() => openEditPatient(selectedPatient)}>
                    <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Edit Patient</Text>
                  </Pressable>

                  {!selectedPatient.identity_verified && (
                    <Pressable style={[styles.actionBtn, styles.verifyBtn]} onPress={() => verifyPatientIdentity(selectedPatient.id)}>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnText}>Verify Identity</Text>
                    </Pressable>
                  )}

                  {!selectedPatient.biometric_enrolled && (
                    <Pressable style={[styles.actionBtn, styles.biometricBtn]} onPress={() => enrollBiometric(selectedPatient.id)}>
                      <Ionicons name="finger-print-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.actionBtnText}>Enroll Biometric</Text>
                    </Pressable>
                  )}

                  <Pressable style={[styles.actionBtn, styles.encounterBtn]} onPress={() => openStartEncounter(selectedPatient)}>
                    <Ionicons name="play-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Start Encounter</Text>
                  </Pressable>
                </View>

                <View style={styles.fileSection}>
                  <View style={styles.encounterHeader}>
                    <View>
                      <Text style={styles.fileSectionTitle}>Patient Encounters</Text>
                      <Text style={styles.fileSectionSubtitle}>Previous and active healthcare visits</Text>
                    </View>
                    <View style={styles.encounterCountBadge}>
                      <Text style={styles.encounterCountText}>{patientEncounters.length}</Text>
                    </View>
                  </View>

                  {loadingPatientFile ? (
                    <View style={styles.encounterEmptyState}>
                      <ActivityIndicator color="#2563eb" />
                      <Text style={styles.emptyText}>Loading encounters...</Text>
                    </View>
                  ) : patientEncounters.length === 0 ? (
                    <View style={styles.encounterEmptyState}>
                      <Ionicons name="calendar-outline" size={36} color="#CBD5E1" />
                      <Text style={styles.emptyTitle}>No encounters found</Text>
                      <Text style={styles.emptyText}>This patient has no recorded encounters yet.</Text>
                    </View>
                  ) : (
                    patientEncounters.map((encounter) => (
                      <View key={encounter.id} style={styles.encounterCard}>
                        <View style={styles.encounterTopRow}>
                          <View style={styles.encounterDate}>
                            <Text style={styles.encounterDateText}>
                              {new Date(encounter.check_in_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Text>
                            <Text style={styles.encounterTimeText}>
                              {new Date(encounter.check_in_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                          <View style={[styles.badge, encounter.status === 'active' ? styles.badgeGreen : styles.badgeGray]}>
                            <Text style={[styles.badgeText, encounter.status === 'active' ? styles.badgeTextGreen : styles.badgeTextGray]}>
                              {encounter.status.charAt(0).toUpperCase() + encounter.status.slice(1)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.encounterDetails}>
                          <PatientFileField label="FACILITY" value={encounter.facility_name} />
                          <PatientFileField label="DEPARTMENT" value={encounter.department ?? 'Not specified'} />
                          <PatientFileField label="REASON" value={encounter.reason ?? 'Not specified'} />
                          <PatientFileField label="HEALTHCARE WORKER" value={encounter.healthcare_worker_name} />
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================= */}
      {/* EDIT PATIENT MODAL */}
      {/* ========================================= */}
      <Modal visible={showEditPatient} transparent animationType="fade" onRequestClose={() => setShowEditPatient(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Edit Patient</Text>
                <Text style={styles.modalSubtitle}>{editingPatient?.first_name} {editingPatient?.last_name}</Text>
              </View>
              <Pressable onPress={() => setShowEditPatient(false)}>
                <Ionicons name="close" size={28} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput value={editFirstName} onChangeText={setEditFirstName} style={styles.inputSmall} placeholderTextColor="#94A3B8" placeholder="First name" />

            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput value={editLastName} onChangeText={setEditLastName} style={styles.inputSmall} placeholderTextColor="#94A3B8" placeholder="Last name" />

            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput value={editPhone} onChangeText={setEditPhone} style={styles.inputSmall} placeholderTextColor="#94A3B8" placeholder="Phone" keyboardType="phone-pad" />

            <Text style={styles.inputLabel}>Address</Text>
            <TextInput value={editAddress} onChangeText={setEditAddress} style={[styles.inputSmall, styles.textArea]} placeholderTextColor="#94A3B8" placeholder="Address" multiline numberOfLines={2} />

            <Text style={styles.inputLabel}>Emergency Contact Name</Text>
            <TextInput value={editEmergencyName} onChangeText={setEditEmergencyName} style={styles.inputSmall} placeholderTextColor="#94A3B8" placeholder="Name" />

            <Text style={styles.inputLabel}>Emergency Contact Phone</Text>
            <TextInput value={editEmergencyPhone} onChangeText={setEditEmergencyPhone} style={styles.inputSmall} placeholderTextColor="#94A3B8" placeholder="Phone" keyboardType="phone-pad" />

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setShowEditPatient(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={savePatientEdit}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================= */}
      {/* START ENCOUNTER MODAL */}
      {/* ========================================= */}
      <Modal visible={showStartEncounter} transparent animationType="fade" onRequestClose={() => setShowStartEncounter(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Start New Encounter</Text>
                <Text style={styles.modalSubtitle}>{selectedPatient?.first_name} {selectedPatient?.last_name}</Text>
              </View>
              <Pressable onPress={() => setShowStartEncounter(false)}>
                <Ionicons name="close" size={28} color="#64748B" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Facility</Text>
            {facilities.map((f) => (
              <Pressable
                key={f.id}
                style={[styles.facilityOption, encounterFacility === f.id && styles.facilityOptionSelected]}
                onPress={() => setEncounterFacility(f.id)}
              >
                <View style={[styles.radio, encounterFacility === f.id && styles.radioSelected]}>
                  {encounterFacility === f.id && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.facilityText, encounterFacility === f.id && styles.facilityTextSelected]}>
                  {f.name}
                </Text>
              </Pressable>
            ))}

            <Text style={styles.inputLabel}>Department (Optional)</Text>
            <TextInput value={encounterDepartment} onChangeText={setEncounterDepartment} style={styles.inputSmall} placeholderTextColor="#94A3B8" placeholder="Department" />

            <Text style={styles.inputLabel}>Reason for Visit</Text>
            <TextInput value={encounterReason} onChangeText={setEncounterReason} style={[styles.inputSmall, styles.textArea]} placeholderTextColor="#94A3B8" placeholder="Reason" multiline numberOfLines={3} />

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setShowStartEncounter(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveButton} onPress={createEncounter}>
                <Text style={styles.saveButtonText}>Start Encounter</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUCCESS TOAST */}
      {successMessage !== '' && (
        <View style={styles.successToast}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}
    </View>
  );
}

// =========================================
// SUB COMPONENTS
// =========================================

function PatientFileField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.patientFileField}>
      <Text style={styles.patientFileFieldLabel}>{label}</Text>
      <Text style={styles.patientFileFieldValue}>{value}</Text>
    </View>
  );
}

// =========================================
// STYLES
// =========================================

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 16 },

  container: { flex: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 30, backgroundColor: '#f8fafc' },

  header: { marginBottom: 28 },
  logo: { fontSize: 30, fontWeight: '800', color: '#2563eb', letterSpacing: 1 },
  systemText: { fontSize: 12, color: '#94a3b8', marginTop: 3 },

  title: { fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  description: { fontSize: 15, lineHeight: 22, color: '#64748b', marginBottom: 25, maxWidth: 600 },

  inputLabel: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 8 },
  input: {
    height: 54,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 17,
    color: '#0f172a',
  },
  inputSmall: {
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingHorizontal: 12,
    color: '#172B4D',
    fontSize: 13,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 10 },
  inputDisabled: { opacity: 0.6 },

  inputFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 14 },
  helperText: { fontSize: 12, color: '#94a3b8' },
  characterCount: { fontSize: 12, fontWeight: '600', color: '#64748b' },

  button: {
    height: 54,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  loadingButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600', marginLeft: 10 },

  clearButton: { alignItems: 'center', paddingVertical: 12 },
  clearButtonText: { color: '#64748b', fontSize: 14, fontWeight: '600' },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 14,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: { color: '#172B4D', fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#64748B', fontSize: 11, marginTop: 2 },

  // Directory
  directorySection: { marginBottom: 10 },
  directoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  directoryTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  directoryCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingHorizontal: 12,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  searchInput: { flex: 1, color: '#172B4D', fontSize: 12, outlineStyle: 'none' as any },

  directoryLoading: { alignItems: 'center', paddingVertical: 30 },
  directoryLoadingText: { marginTop: 8, color: '#64748b', fontSize: 13 },
  directoryEmpty: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  directoryEmptyTitle: { fontSize: 14, fontWeight: '600', color: '#334155' },
  directoryEmptyText: { fontSize: 12, color: '#94a3b8', marginTop: 4 },

  directoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  directoryAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  directoryAvatarText: { color: '#1e40af', fontSize: 15, fontWeight: '700' },
  directoryInfo: { flex: 1 },
  directoryName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  directoryId: { fontSize: 12, color: '#64748b', marginTop: 2 },
  directoryArrow: { color: '#94a3b8', fontSize: 20, fontWeight: '700' },

  // Badges
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  badgeGreen: { backgroundColor: '#ECFDF5' },
  badgeTextGreen: { color: '#059669' },
  badgeOrange: { backgroundColor: '#FFF7ED' },
  badgeTextOrange: { color: '#EA580C' },
  badgeRed: { backgroundColor: '#FEF2F2' },
  badgeTextRed: { color: '#DC2626' },
  badgeGray: { backgroundColor: '#F1F5F9' },
  badgeTextGray: { color: '#475569' },

  // Security
  securityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 10,
    padding: 14,
    marginTop: 22,
    marginBottom: 30,
  },
  securityIcon: { fontSize: 20, marginRight: 10 },
  securityContent: { flex: 1 },
  securityTitle: { fontSize: 12, fontWeight: '700', color: '#1e40af' },
  securityText: { fontSize: 11, color: '#475569', marginTop: 3, lineHeight: 16 },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  patientFileModal: {
    width: '100%',
    maxWidth: 850,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
  },
  modal: { width: '100%', maxWidth: 500, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24 },
  patientFileScroll: { flexGrow: 0 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  modalTitle: { color: '#172B4D', fontSize: 20, fontWeight: '700' },
  modalSubtitle: { color: '#64748B', fontSize: 12, marginTop: 4 },

  patientFileHeader: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  patientFileIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientFileIconText: { color: '#123B78', fontSize: 20, fontWeight: '800' },
  patientFileHeaderInfo: { flex: 1, marginLeft: 13 },
  patientFileName: { color: '#172B4D', fontSize: 16, fontWeight: '700' },
  patientFileNumber: { color: '#123B78', fontSize: 11, fontWeight: '700', marginTop: 4 },

  fileSection: { marginBottom: 20 },
  fileSectionTitle: { color: '#172B4D', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  fileSectionSubtitle: { color: '#94A3B8', fontSize: 11, marginTop: -6, marginBottom: 10 },
  fileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    overflow: 'hidden',
  },
  patientFileField: {
    width: '50%',
    padding: 11,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F1F5F9',
  },
  patientFileFieldLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  patientFileFieldValue: { color: '#334155', fontSize: 12, fontWeight: '600', marginTop: 4 },

  emergencyCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    padding: 13,
  },
  emergencyName: { color: '#9A3412', fontSize: 13, fontWeight: '700' },
  emergencyPhone: { color: '#C2410C', fontSize: 12, marginTop: 4 },

  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 15,
    marginBottom: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  editBtn: { backgroundColor: '#2563EB' },
  verifyBtn: { backgroundColor: '#059669' },
  biometricBtn: { backgroundColor: '#7C3AED' },
  encounterBtn: { backgroundColor: '#EA580C' },

  encounterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  encounterCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  encounterCountText: { color: '#123B78', fontSize: 11, fontWeight: '800' },
  encounterCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  encounterTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  encounterDate: { flexDirection: 'row', alignItems: 'center' },
  encounterDateText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  encounterTimeText: { color: '#94A3B8', fontSize: 11, marginLeft: 8 },
  encounterDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  encounterEmptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9,
    backgroundColor: '#F8FAFC',
  },
  emptyTitle: { color: '#334155', fontSize: 14, fontWeight: '600', marginTop: 10 },
  emptyText: { color: '#94A3B8', fontSize: 12, marginTop: 4, textAlign: 'center' },

  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 10 },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  cancelButtonText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  saveButton: { backgroundColor: '#123B78', borderRadius: 7, paddingHorizontal: 16, paddingVertical: 11 },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  facilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  facilityOptionSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  facilityText: { color: '#475569', fontSize: 13, fontWeight: '600' },
  facilityTextSelected: { color: '#1D4ED8' },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioSelected: { borderColor: '#2563EB' },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#2563EB' },

  successToast: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 360,
    elevation: 5,
  },
  successCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  successText: { color: '#065F46', fontSize: 12, fontWeight: '600', flex: 1 },
});