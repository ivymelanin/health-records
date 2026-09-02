import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';

export default function DashboardScreen() {
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email ?? '');
      setUserRole(user?.user_metadata?.role ?? 'Healthcare Worker');
    } catch (error) {
      console.error('DASHBOARD USER ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const getShowRole = () => {
    if (!userRole) return '';

    const roleMap: Record<string, string> = {
      admin: 'Admin',
      administrator: 'Admin',
      doctor: 'Dr.',
      nurse: 'Nurse',
      paramedic: 'Paramedic',
      'healthcare worker': 'Healthcare Worker',
    };

    const normalizedRole = userRole.trim().toLowerCase();
    return roleMap[normalizedRole] ?? userRole;
  };

  const getFirstName = () => {
    if (!userEmail) return 'there';

    return userEmail
      .split('@')[0]
      .split(/[._-]/)[0]
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      {/* SIDEBAR */}
      <View style={styles.sidebar}>
        <View>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>+</Text>
            </View>

            <View>
              <Text style={styles.logoText}>CARELINK</Text>
              <Text style={styles.logoSubtitle}>Health System</Text>
            </View>
          </View>

          {/* Navigation */}
          <View style={styles.navigation}>
            <Text style={styles.navigationLabel}>MAIN MENU</Text>

            <Pressable style={[styles.navItem, styles.activeNavItem]}>
              <Text style={styles.navIcon}>⌂</Text>
              <Text style={styles.activeNavText}>Dashboard</Text>
            </Pressable>

            <Pressable
              style={styles.navItem}
              onPress={() => router.push('/(app)/patients')}
            >
              <Text style={styles.navIcon}>♙</Text>
              <Text style={styles.navText}>Patients</Text>
            </Pressable>

            <Pressable style={styles.navItem}>
              <Text style={styles.navIcon}>▤</Text>
              <Text style={styles.navText}>Medical Records</Text>
            </Pressable>

            <Pressable style={styles.navItem}>
              <Text style={styles.navIcon}>□</Text>
              <Text style={styles.navText}>Appointments</Text>
            </Pressable>

            <Text style={[styles.navigationLabel, styles.secondLabel]}>
              SERVICES
            </Text>

            <Pressable style={styles.navItem}>
              <Text style={styles.emergencyIcon}>!</Text>
              <Text style={styles.navText}>Emergency</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom navigation */}
        <View>
          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/(app)/profile')}
          >
            <Text style={styles.navIcon}>○</Text>
            <Text style={styles.navText}>Profile</Text>
          </Pressable>

          <Pressable style={styles.navItem} onPress={handleSignOut}>
            <Text style={styles.navIcon}>↪</Text>
            <Text style={styles.navText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>

      {/* MAIN CONTENT */}
      <View style={styles.main}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>CARELINK</Text>
            <Text style={styles.headerSubtitle}>
              Electronic Health Records
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>♧</Text>
              <View style={styles.notificationDot} />
            </Pressable>

            <View style={styles.profileMini}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getFirstName().charAt(0)}
                </Text>
              </View>

              <View>
                <Text style={styles.profileName}>{getFirstName()}</Text>
                <Text style={styles.profileRole}>{userRole || 'Healthcare Worker'}</Text>
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
          {/* WELCOME */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              Good morning, {getShowRole()} {getFirstName()}👋
            </Text>

            <Text style={styles.welcomeSubtitle}>
              Here's what's happening with your patients today.
            </Text>
          </View>

          {/* STATISTICS */}
          <View style={styles.statsGrid}>
           <StatCard
              icon="♙"
              number="128"
              label="Total Patients"
              detail="+8 today"
              iconBackground="#EFF6FF"
              iconColor="#2563EB"
            />

            <StatCard
              icon="□"
              number="12"
              label="Today's Appointments"
              detail="4 upcoming"
              iconBackground="#ECFDF5"
              iconColor="#0F766E"
            />

            <StatCard
              icon="▤"
              number="08"
              label="Pending Records"
              detail="Needs attention"
              iconBackground="#FFF7ED"
              iconColor="#EA580C"
            />

            <StatCard
              icon="!"
              number="03"
              label="Emergency Alerts"
              detail="View alerts →"
              iconBackground="#FEF2F2"
              iconColor="#DC2626"
              emergency
            />
          </View>

          {/* QUICK ACTIONS */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <Text style={styles.sectionSubtitle}>
                Common tasks at your fingertips
              </Text>
            </View>
          </View>

          <View style={styles.quickActions}>
            <ActionCard
              icon="⌕"
              title="Find Patient"
              description="Search by ID or name"
              onPress={() => router.push('/(app)/patients')}
            />

            <ActionCard
              icon="♧"
              title="Emergency Patient"
              description="Identify a patient quickly"
              emergency
            />

            <ActionCard
              icon="+"
              title="Add Medical Record"
              description="Create a new patient record"
            />
          </View>

          {/* LOWER CONTENT */}
          <View style={styles.lowerGrid}>
            {/* RECENT PATIENTS */}
            <View style={styles.largeCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Recent Patients</Text>
                  <Text style={styles.cardSubtitle}>
                    Recently accessed records
                  </Text>
                </View>

                <Pressable
                  onPress={() => router.push('/(app)/patients')}
                >
                  <Text style={styles.viewAll}>View all →</Text>
                </Pressable>
              </View>

              <PatientRow
                initials="JD"
                name="John Doe"
                patientId="CL-0001"
                time="Today, 10:42"
              />

              <PatientRow
                initials="SM"
                name="Sarah Mokoena"
                patientId="CL-0002"
                time="Today, 09:31"
              />

              <PatientRow
                initials="TN"
                name="Thabo Nkosi"
                patientId="CL-0003"
                time="Today, 08:54"
              />

              <PatientRow
                initials="ND"
                name="Nomsa Dlamini"
                patientId="CL-0004"
                time="Yesterday"
              />
            </View>

            {/* SCHEDULE */}
            <View style={styles.scheduleCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>Today's Schedule</Text>
                  <Text style={styles.cardSubtitle}>
                    Your upcoming appointments
                  </Text>
                </View>
              </View>

              <Appointment
                time="09:00"
                name="John Doe"
                type="General Consultation"
              />

              <Appointment
                time="11:30"
                name="Sarah Mokoena"
                type="Follow-up"
              />

              <Appointment
                time="14:00"
                name="Thabo Nkosi"
                type="Medical Review"
              />

              <Pressable style={styles.scheduleButton}>
                <Text style={styles.scheduleButtonText}>
                  View Schedule →
                </Text>
              </Pressable>
            </View>
          </View>

          {/* EMERGENCY BANNER */}
          <View style={styles.emergencyBanner}>
            <View style={styles.emergencyBannerIcon}>
              <Text style={styles.emergencyBannerIconText}>!</Text>
            </View>

            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>
                Emergency Patient Identification
              </Text>

              <Text style={styles.emergencyDescription}>
                Unable to identify a patient? Quickly locate their
                medical record and access critical information.
              </Text>
            </View>

            <Pressable style={styles.emergencyButton}>
              <Text style={styles.emergencyButtonText}>
                Identify Patient
              </Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              CARELINK • Secure Electronic Health Records
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  icon,
  number,
  label,
  detail,
  iconBackground,
  iconColor,
  emergency = false,
}: {
  icon: string;
  number: string;
  label: string;
  detail: string;
  iconBackground: string;
  iconColor: string;
  emergency?: boolean;
}) {
  return (
    <View
      style={[
        styles.statCard,
        emergency && styles.emergencyStatCard,
      ]}
    >
      <View
        style={[
          styles.statIcon,
          { backgroundColor: iconBackground },
        ]}
      >
        <Text style={[styles.statIconText, { color: iconColor }]}>
          {icon}
        </Text>
      </View>

      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>

      <Text style={[styles.statDetail, { color: iconColor }]}>
        {detail}
      </Text>
    </View>
  );
}

/* =========================
   ACTION CARD
========================= */

function ActionCard({
  icon,
  title,
  description,
  onPress,
  emergency = false,
}: {
  icon: string;
  title: string;
  description: string;
  onPress?: () => void;
  emergency?: boolean;
}) {
  return (
    <Pressable
      style={[
        styles.actionCard,
        emergency && styles.emergencyActionCard,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.actionIcon,
          emergency && styles.emergencyActionIcon,
        ]}
      >
        <Text
          style={[
            styles.actionIconText,
            emergency && styles.emergencyActionIconText,
          ]}
        >
          {icon}
        </Text>
      </View>

      <View style={styles.actionTextContainer}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>

      <Text style={styles.actionArrow}>→</Text>
    </Pressable>
  );
}

/* =========================
   PATIENT ROW
========================= */

function PatientRow({
  initials,
  name,
  patientId,
  time,
}: {
  initials: string;
  name: string;
  patientId: string;
  time: string;
}) {
  return (
    <Pressable style={styles.patientRow}>
      <View style={styles.patientAvatar}>
        <Text style={styles.patientAvatarText}>{initials}</Text>
      </View>

      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{name}</Text>
        <Text style={styles.patientId}>{patientId}</Text>
      </View>

      <View style={styles.patientTimeContainer}>
        <View style={styles.activeDot} />
        <Text style={styles.patientTime}>{time}</Text>
      </View>
    </Pressable>
  );
}

/* =========================
   APPOINTMENT
========================= */

function Appointment({
  time,
  name,
  type,
}: {
  time: string;
  name: string;
  type: string;
}) {
  return (
    <View style={styles.appointment}>
      <View style={styles.timeContainer}>
        <Text style={styles.appointmentTime}>{time}</Text>
      </View>

      <View style={styles.appointmentLine} />

      <View style={styles.appointmentInfo}>
        <Text style={styles.appointmentName}>{name}</Text>
        <Text style={styles.appointmentType}>{type}</Text>
      </View>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  /* SIDEBAR */

  sidebar: {
    width: 245,
    backgroundColor: '#0F2A43',
    paddingVertical: 28,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 45,
  },

  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  logoIconText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '700',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },

  logoSubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },

  navigation: {
    gap: 4,
  },

  navigationLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginLeft: 12,
    marginBottom: 8,
  },

  secondLabel: {
    marginTop: 28,
  },

  navItem: {
    height: 46,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 3,
  },

  activeNavItem: {
    backgroundColor: '#1D4ED8',
  },

  navIcon: {
    width: 27,
    color: '#94A3B8',
    fontSize: 19,
  },

  activeNavText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  navText: {
    color: '#CBD5E1',
    fontSize: 14,
  },

  emergencyIcon: {
    width: 27,
    color: '#F87171',
    fontSize: 18,
    fontWeight: '800',
  },

  /* MAIN */

  main: {
    flex: 1,
    minWidth: 0,
  },

  header: {
    height: 76,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#0F2A43',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },

  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },

  notificationIcon: {
    fontSize: 18,
    color: '#475569',
  },

  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },

  profileMini: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  avatarText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 16,
  },

  profileName: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },

  profileRole: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },

  chevron: {
    color: '#94A3B8',
    fontSize: 18,
    marginLeft: 10,
  },

  /* CONTENT */

  scrollView: {
    flex: 1,
  },

  content: {
    padding: 32,
    paddingBottom: 50,
  },

  welcomeSection: {
    marginBottom: 26,
  },

  welcomeTitle: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '700',
  },

  welcomeSubtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 6,
  },

  /* STATS */

  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },

  statCard: {
    flex: 1,
    minHeight: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },

  emergencyStatCard: {
    borderColor: '#FECACA',
  },

  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  statIconText: {
    fontSize: 20,
    fontWeight: '700',
  },

  statNumber: {
    color: '#0F172A',
    fontSize: 27,
    fontWeight: '700',
  },

  statLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },

  statDetail: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 9,
  },

  /* SECTIONS */

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },

  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
  },

  /* QUICK ACTIONS */

  quickActions: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 30,
  },

  actionCard: {
    flex: 1,
    minHeight: 95,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  emergencyActionCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },

  actionIcon: {
    width: 45,
    height: 45,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emergencyActionIcon: {
    backgroundColor: '#FEF2F2',
  },

  actionIconText: {
    color: '#2563EB',
    fontSize: 22,
    fontWeight: '600',
  },

  emergencyActionIconText: {
    color: '#DC2626',
  },

  actionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  actionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },

  actionDescription: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },

  actionArrow: {
    color: '#94A3B8',
    fontSize: 18,
    marginLeft: 8,
  },

  /* LOWER GRID */

  lowerGrid: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 22,
  },

  largeCard: {
    flex: 1.55,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },

  scheduleCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },

  cardTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },

  cardSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
  },

  viewAll: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '600',
  },

  /* PATIENTS */

  patientRow: {
    minHeight: 64,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
  },

  patientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  patientAvatarText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },

  patientInfo: {
    flex: 1,
    marginLeft: 12,
  },

  patientName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },

  patientId: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 3,
  },

  patientTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 7,
  },

  patientTime: {
    color: '#64748B',
    fontSize: 10,
  },

  /* APPOINTMENTS */

  appointment: {
    flexDirection: 'row',
    minHeight: 65,
  },

  timeContainer: {
    width: 45,
  },

  appointmentTime: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },

  appointmentLine: {
    width: 2,
    backgroundColor: '#DBEAFE',
    marginHorizontal: 10,
  },

  appointmentInfo: {
    flex: 1,
  },

  appointmentName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '600',
  },

  appointmentType: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },

  scheduleButton: {
    marginTop: 5,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },

  scheduleButtonText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '600',
  },

  /* EMERGENCY */

  emergencyBanner: {
    backgroundColor: '#FFF7F7',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  emergencyBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  emergencyBannerIconText: {
    color: '#DC2626',
    fontSize: 22,
    fontWeight: '800',
  },

  emergencyContent: {
    flex: 1,
    marginLeft: 15,
    marginRight: 20,
  },

  emergencyTitle: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '700',
  },

  emergencyDescription: {
    color: '#7F1D1D',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  emergencyButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },

  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  footer: {
    alignItems: 'center',
    marginTop: 30,
  },

  footerText: {
    color: '#CBD5E1',
    fontSize: 10,
  },
});