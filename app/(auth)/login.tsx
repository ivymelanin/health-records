
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { useState } from 'react';
import { router } from 'expo-router';

import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get screen dimensions
  const { width, height } = useWindowDimensions();

  // Responsive breakpoints
  const isSmallPhone = width < 380;
  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 900;
  const isDesktop = width >= 900;

  // Detect short screens / landscape
  const isShortScreen = height < 700;

  const handleLogin = async () => {
    // Check that the user entered both fields
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing information',
        'Please enter your email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      console.log('LOGIN: attempting...');

      // 1. Sign in using Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      // Login failed
      if (error) {
        console.error('LOGIN ERROR:', error.message);

        Alert.alert('Login failed', error.message);
        return;
      }

      // Make sure we have a user
      if (!data.user) {
        Alert.alert(
          'Login failed',
          'User account could not be found.'
        );
        return;
      }

      console.log('LOGIN SUCCESS:', data.user.id);

      // 2. Get this user's profile and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      // Profile/role could not be found
      if (profileError) {
        console.error('PROFILE ERROR:', profileError.message);

        Alert.alert(
          'Login error',
          'Your user profile or role could not be found.'
        );

        return;
      }

      console.log('USER ROLE:', profile.role);

      // 3. Send the user to the correct dashboard
      if (profile.role === 'admin') {
        router.replace('/(app)/admin');
      } else if (profile.role === 'healthcare_worker') {
        router.replace('/(app)/dashboard');
      } else if (profile.role === 'hr') {
        router.replace('/(app)/staff-dashboard');
      } else {
        Alert.alert(
          'Invalid role',
          'Your account does not have a valid role assigned.'
        );
      }
    } catch (error) {
      console.error('LOGIN EXCEPTION:', error);

      Alert.alert(
        'Error',
        'Something went wrong while logging in.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        isSmallPhone && styles.containerSmallPhone,
        isShortScreen && styles.containerShortScreen,
      ]}
    >
      {/* RESPONSIVE LOGIN CARD */}
      <View
        style={[
          styles.loginCard,

          // Phone
          isPhone && styles.loginCardPhone,

          // Small phone
          isSmallPhone && styles.loginCardSmallPhone,

          // Tablet
          isTablet && styles.loginCardTablet,

          // Desktop
          isDesktop && styles.loginCardDesktop,

          // Short screen / landscape
          isShortScreen && styles.loginCardShortScreen,
        ]}
      >
        {/* LOGO */}
        <Text
          style={[
            styles.logo,

            isSmallPhone && styles.logoSmallPhone,
            isTablet && styles.logoTablet,
            isDesktop && styles.logoDesktop,
            isShortScreen && styles.logoShortScreen,
          ]}
        >
          CARELINK
        </Text>

        {/* TITLE */}
        <Text
          style={[
            styles.title,

            isSmallPhone && styles.titleSmallPhone,
            isTablet && styles.titleTablet,
            isDesktop && styles.titleDesktop,
          ]}
        >
          Welcome Back
        </Text>

        {/* SUBTITLE */}
        <Text
          style={[
            styles.subtitle,
            isSmallPhone && styles.subtitleSmallPhone,
            isDesktop && styles.subtitleDesktop,
          ]}
        >
          Sign in to access patient records
        </Text>

        {/* EMAIL */}
        <TextInput
          style={[
            styles.input,
            isSmallPhone && styles.inputSmallPhone,
            isTablet && styles.inputTablet,
            isDesktop && styles.inputDesktop,
          ]}
          placeholder="Email address"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        {/* PASSWORD */}
        <View
          style={[
            styles.passwordContainer,
            isSmallPhone && styles.passwordContainerSmallPhone,
          ]}
        >
          <TextInput
            style={[
              styles.passwordInput,
              isSmallPhone && styles.passwordInputSmallPhone,
              isTablet && styles.passwordInputTablet,
              isDesktop && styles.passwordInputDesktop,
            ]}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* SHOW / HIDE PASSWORD */}
          <TouchableOpacity
            style={styles.passwordIcon}
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeIcon}>
              {showPassword ? '◉' : '◌'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* FORGOT PASSWORD */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          disabled={loading}
          style={styles.forgotContainer}
        >
          <Text style={styles.forgotPassword}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* SIGN IN BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            isSmallPhone && styles.buttonSmallPhone,
            isTablet && styles.buttonTablet,
            isDesktop && styles.buttonDesktop,
            loading && styles.disabledButton,
          ]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              Sign In
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // =========================================================
  // MAIN SCREEN
  // =========================================================

  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },

  containerSmallPhone: {
    paddingHorizontal: 16,
  },

  containerShortScreen: {
    justifyContent: 'flex-start',
    paddingTop: 30,
    paddingBottom: 30,
  },

  // =========================================================
  // LOGIN CARD
  // =========================================================

  loginCard: {
    width: '100%',
    maxWidth: 500,
  },

  loginCardPhone: {
    maxWidth: 500,
  },

  loginCardSmallPhone: {
    maxWidth: 360,
  },

  loginCardTablet: {
    maxWidth: 500,
  },

  loginCardDesktop: {
    maxWidth: 460,
  },

  loginCardShortScreen: {
    maxWidth: 500,
  },

  // =========================================================
  // LOGO
  // =========================================================

  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 35,
    letterSpacing: 1,
  },

  logoSmallPhone: {
    fontSize: 28,
    marginBottom: 24,
  },

  logoTablet: {
    fontSize: 36,
    marginBottom: 32,
  },

  logoDesktop: {
    fontSize: 38,
    marginBottom: 40,
  },

  logoShortScreen: {
    marginBottom: 20,
  },

  // =========================================================
  // TITLE
  // =========================================================

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },

  titleSmallPhone: {
    fontSize: 24,
  },

  titleTablet: {
    fontSize: 29,
  },

  titleDesktop: {
    fontSize: 30,
  },

  // =========================================================
  // SUBTITLE
  // =========================================================

  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 28,
  },

  subtitleSmallPhone: {
    fontSize: 14,
    marginBottom: 22,
  },

  subtitleDesktop: {
    fontSize: 15,
    marginBottom: 30,
  },

  // =========================================================
  // EMAIL INPUT
  // =========================================================

  input: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },

  inputSmallPhone: {
    height: 48,
    fontSize: 15,
    borderRadius: 9,
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  inputTablet: {
    height: 54,
    fontSize: 16,
  },

  inputDesktop: {
    height: 54,
    fontSize: 16,
  },

  // =========================================================
  // PASSWORD CONTAINER
  // =========================================================

  passwordContainer: {
    width: '100%',
    height: 52,
    position: 'relative',
    marginBottom: 14,
  },

  passwordContainerSmallPhone: {
    height: 48,
    marginBottom: 12,
  },

  // =========================================================
  // PASSWORD INPUT
  // =========================================================

  passwordInput: {
    width: '100%',
    height: 52,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingRight: 50,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },

  passwordInputSmallPhone: {
    height: 48,
    fontSize: 15,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingRight: 46,
  },

  passwordInputTablet: {
    height: 54,
  },

  passwordInputDesktop: {
    height: 54,
  },

  // =========================================================
  // PASSWORD EYE BUTTON
  // =========================================================

  passwordIcon: {
    position: 'absolute',
    right: 16,
    top: 0,
    height: 52,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  eyeIcon: {
    fontSize: 20,
    color: '#64748b',
  },

  // =========================================================
  // FORGOT PASSWORD
  // =========================================================

  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },

  forgotPassword: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },

  // =========================================================
  // SIGN IN BUTTON
  // =========================================================

  button: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  buttonSmallPhone: {
    height: 48,
    borderRadius: 9,
  },

  buttonTablet: {
    height: 54,
  },

  buttonDesktop: {
    height: 54,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});


