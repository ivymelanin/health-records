import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Redirect, router } from 'expo-router';

import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';

import { useAuth } from '../../context/AuthContext';

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
};

export default function ProfileScreen() {
  const { session } = useAuth();

  const { width } = useWindowDimensions();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 900;
  const isDesktop = width >= 900;

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      return;
    }

    const userId = session.user.id;

    async function loadProfile() {
      try {
        setLoading(true);
        setError(null);

        const {
          data,
          error,
        } = await supabase
          .from('profiles')
          .select(
            'id, first_name, last_name, role'
          )
          .eq('id', userId)
          .single();

        if (error) {
          console.error(
            'PROFILE ERROR:',
            error.message
          );

          setError(error.message);
          return;
        }

        setProfile(data);
      } catch (error) {
        console.error(
          'PROFILE EXCEPTION:',
          error
        );

        setError(
          'Unable to load your profile.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [session]);

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <View style={styles.loadingCard}>
          <ActivityIndicator
            size="large"
            color="#154581"
          />

          <Text style={styles.loadingText}>
            Loading profile...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>
              !
            </Text>
          </View>

          <Text style={styles.errorTitle}>
            Profile Error
          </Text>

          <Text style={styles.errorText}>
            {error}
          </Text>

          <TouchableOpacity
            style={styles.backHomeButton}
            onPress={() =>
              router.replace('/(app)/dashboard')
            }
            activeOpacity={0.8}
          >
            <Text style={styles.backHomeButtonText}>
              Back to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>
              !
            </Text>
          </View>

          <Text style={styles.errorTitle}>
            Profile Not Found
          </Text>

          <Text style={styles.errorText}>
            Your profile information could not be
            found.
          </Text>

          <TouchableOpacity
            style={styles.backHomeButton}
            onPress={() =>
              router.replace('/(app)/dashboard')
            }
            activeOpacity={0.8}
          >
            <Text style={styles.backHomeButtonText}>
              Back to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const fullName =
    `${profile.first_name} ${profile.last_name}`.trim();

  const roleDisplay =
    profile.role === 'healthcare_worker'
      ? 'Healthcare Worker'
      : profile.role === 'admin'
        ? 'Administrator'
        : profile.role;

  const initials =
    `${profile.first_name?.charAt(0) || ''}${profile.last_name?.charAt(0) || ''}`
      .toUpperCase();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.pageContainer,
          isDesktop &&
            styles.pageContainerDesktop,
        ]}
      >
        {/* =====================================================
            HEADER
        ===================================================== */}

        <View
          style={[
            styles.header,
            isMobile && styles.headerMobile,
          ]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                router.replace('/(app)/dashboard')
              }
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>
                ‹
              </Text>
            </TouchableOpacity>

            <View>
              <Text
                style={[
                  styles.pageTitle,
                  isMobile &&
                    styles.pageTitleMobile,
                ]}
              >
                My Profile
              </Text>

              <Text style={styles.pageSubtitle}>
                View your CARELINK account information
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            isMobile &&
              styles.scrollContentMobile,
          ]}
        >
          {/* =====================================================
              PROFILE OVERVIEW
          ===================================================== */}

          <View
            style={[
              styles.profileOverview,
              isMobile &&
                styles.profileOverviewMobile,
            ]}
          >
            <View
              style={[
                styles.avatar,
                isMobile && styles.avatarMobile,
              ]}
            >
              <Text
                style={[
                  styles.avatarText,
                  isMobile &&
                    styles.avatarTextMobile,
                ]}
              >
                {initials || '?'}
              </Text>
            </View>

            <View
              style={[
                styles.profileOverviewInfo,
                isMobile &&
                  styles.profileOverviewInfoMobile,
              ]}
            >
              <Text
                style={[
                  styles.profileName,
                  isMobile &&
                    styles.profileNameMobile,
                ]}
              >
                {fullName || 'CARELINK User'}
              </Text>

              <Text style={styles.profileRole}>
                {roleDisplay}
              </Text>

              <View style={styles.statusRow}>
                <View style={styles.statusDot} />

                <Text style={styles.statusText}>
                  Active Account
                </Text>
              </View>
            </View>
          </View>

          {/* =====================================================
              ACCOUNT INFORMATION
          ===================================================== */}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  Account Information
                </Text>

                <Text style={styles.cardSubtitle}>
                  Your registered CARELINK account
                  details
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.detailsGrid,
                isMobile &&
                  styles.detailsGridMobile,
              ]}
            >
              {/* First Name */}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>
                  FIRST NAME
                </Text>

                <View style={styles.detailValueBox}>
                  <Text style={styles.detailValue}>
                    {profile.first_name || 'Not provided'}
                  </Text>
                </View>
              </View>

              {/* Last Name */}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>
                  LAST NAME
                </Text>

                <View style={styles.detailValueBox}>
                  <Text style={styles.detailValue}>
                    {profile.last_name || 'Not provided'}
                  </Text>
                </View>
              </View>

              {/* Email */}
              <View
                style={[
                  styles.detailItem,
                  styles.detailItemFull,
                ]}
              >
                <Text style={styles.detailLabel}>
                  EMAIL ADDRESS
                </Text>

                <View style={styles.detailValueBox}>
                  <Text
                    style={[
                      styles.detailValue,
                      isMobile &&
                        styles.emailValueMobile,
                    ]}
                    numberOfLines={2}
                  >
                    {session.user.email ||
                      'Not provided'}
                  </Text>
                </View>
              </View>

              {/* Role */}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>
                  ROLE
                </Text>

                <View style={styles.detailValueBox}>
                  <Text style={styles.detailValue}>
                    {roleDisplay}
                  </Text>
                </View>
              </View>

              {/* Account ID */}
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>
                  ACCOUNT ID
                </Text>

                <View style={styles.detailValueBox}>
                  <Text
                    style={styles.accountId}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {profile.id}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* =====================================================
              ACCOUNT STATUS
          ===================================================== */}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  Account Status
                </Text>

                <Text style={styles.cardSubtitle}>
                  Current status of your CARELINK
                  account
                </Text>
              </View>
            </View>

            <View style={styles.statusCard}>
              <View style={styles.statusLargeIcon}>
                <Text style={styles.statusLargeIconText}>
                  ✓
                </Text>
              </View>

              <View style={styles.statusCardContent}>
                <Text style={styles.statusCardTitle}>
                  Account Active
                </Text>

                <Text style={styles.statusCardText}>
                  Your CARELINK account is active and
                  available for use.
                </Text>
              </View>

              <View style={styles.activeBadge}>
                <View style={styles.activeBadgeDot} />

                <Text style={styles.activeBadgeText}>
                  Active
                </Text>
              </View>
            </View>
          </View>

          {/* =====================================================
              SECURITY INFORMATION
          ===================================================== */}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>
                  Security
                </Text>

                <Text style={styles.cardSubtitle}>
                  Keep your CARELINK account secure
                </Text>
              </View>
            </View>

            <View style={styles.securityRow}>
              <View style={styles.securityIcon}>
                <Text style={styles.securityIconText}>
                  ✓
                </Text>
              </View>

              <View style={styles.securityContent}>
                <Text style={styles.securityTitle}>
                  Account Authentication
                </Text>

                <Text style={styles.securityText}>
                  Your account is authenticated through
                  CARELINK secure login.
                </Text>
              </View>
            </View>
          </View>

          {/* =====================================================
              BACK TO DASHBOARD
          ===================================================== */}

          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={() =>
              router.replace('/(app)/dashboard')
            }
            activeOpacity={0.8}
          >
            <Text style={styles.dashboardButtonText}>
              Back to Dashboard
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7faff',
  },

  pageContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },

  pageContainerDesktop: {
    maxWidth: 1500,
    alignSelf: 'center',
  },

  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#dce6f2',
  },

  headerMobile: {
    minHeight: 82,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dce6f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  backArrow: {
    fontSize: 32,
    lineHeight: 34,
    color: '#154581',
    marginTop: -3,
  },

  pageTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: '#123b6d',
  },

  pageTitleMobile: {
    fontSize: 21,
  },

  pageSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },

  /* =====================================================
     CONTENT
  ===================================================== */

  scrollContent: {
    paddingTop: 24,
    paddingBottom: 45,
  },

  scrollContentMobile: {
    paddingTop: 18,
  },

  /* =====================================================
     PROFILE OVERVIEW
  ===================================================== */

  profileOverview: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dce6f2',
    borderRadius: 14,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  profileOverviewMobile: {
    padding: 18,
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#154581',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },

  avatarMobile: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
  },

  avatarText: {
    fontSize: 27,
    fontWeight: '700',
    color: '#ffffff',
  },

  avatarTextMobile: {
    fontSize: 22,
  },

  profileOverviewInfo: {
    flex: 1,
  },

  profileOverviewInfoMobile: {
    flex: 1,
  },

  profileName: {
    fontSize: 23,
    fontWeight: '700',
    color: '#123b6d',
  },

  profileNameMobile: {
    fontSize: 18,
  },

  profileRole: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginRight: 7,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803d',
  },

  /* =====================================================
     CARDS
  ===================================================== */

  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dce6f2',
    borderRadius: 14,
    padding: 22,
    marginBottom: 20,
  },

  cardHeader: {
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#123b6d',
  },

  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },

  /* =====================================================
     ACCOUNT DETAILS
  ===================================================== */

  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  detailsGridMobile: {
    flexDirection: 'column',
    gap: 14,
  },

  detailItem: {
    flex: 1,
    minWidth: 260,
  },

  detailItemFull: {
    flexBasis: '100%',
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748b',
    marginBottom: 7,
  },

  detailValueBox: {
    minHeight: 47,
    borderWidth: 1,
    borderColor: '#dce6f2',
    borderRadius: 9,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },

  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },

  emailValueMobile: {
    fontSize: 13,
  },

  accountId: {
    fontSize: 12,
    color: '#64748b',
  },

  /* =====================================================
     ACCOUNT STATUS
  ===================================================== */

  statusCard: {
    minHeight: 82,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dce6f2',
    borderRadius: 11,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusLargeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eaf7ef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  statusLargeIconText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#15803d',
  },

  statusCardContent: {
    flex: 1,
  },

  statusCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },

  statusCardText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#eaf7ef',
    marginLeft: 10,
  },

  activeBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginRight: 6,
  },

  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },

  /* =====================================================
     SECURITY
  ===================================================== */

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dce6f2',
    borderRadius: 11,
  },

  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eaf2fb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  securityIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#154581',
  },

  securityContent: {
    flex: 1,
  },

  securityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },

  securityText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    marginTop: 3,
  },

  /* =====================================================
     DASHBOARD BUTTON
  ===================================================== */

  dashboardButton: {
    height: 48,
    alignSelf: 'flex-start',
    minWidth: 180,
    paddingHorizontal: 20,
    borderRadius: 9,
    backgroundColor: '#154581',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dashboardButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* =====================================================
     LOADING
  ===================================================== */

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f7faff',
  },

  loadingCard: {
    width: '100%',
    maxWidth: 350,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dce6f2',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 13,
  },

  /* =====================================================
     ERROR
  ===================================================== */

  errorCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dce6f2',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
  },

  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  errorIconText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dc2626',
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },

  errorText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },

  backHomeButton: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 9,
    backgroundColor: '#154581',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backHomeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});