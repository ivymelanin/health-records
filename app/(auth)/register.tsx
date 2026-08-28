import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useState } from 'react';
<<<<<<< Updated upstream
import { router } from 'expo-router';
=======
import { Link } from 'expo-router';
>>>>>>> Stashed changes

import { supabase } from '../../lib/supabase';

const roles = [
  'Admin',
  'Doctor',
  'Nurse',
  'Paramedic',
];

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');

  const [showRoles, setShowRoles] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Check that all fields have been completed
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !role ||
      !password
    ) {
      Alert.alert(
        'Missing information',
        'Please complete all fields, including selecting your role.'
      );

      return;
    }

    // Check password length
    if (password.length < 6) {
      Alert.alert(
        'Invalid password',
        'Password must contain at least 6 characters.'
      );

      return;
    }

    try {
      setLoading(true);

      console.log('REGISTER: attempting...');
      console.log('REGISTER ROLE:', role);

      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim(),
              role: role,
            },
          },
        });

      if (error) {
        console.error(
          'REGISTER ERROR:',
          error.message
        );

        Alert.alert(
          'Registration failed',
          error.message
        );

        return;
      }

      console.log(
        'REGISTER SUCCESS:',
        data.user?.id
      );

<<<<<<< Updated upstream
      Alert.alert(
  'Registration successful',
  'Your account has been created. Please sign in.',
  [
    {
      text: 'Continue',
      onPress: () => router.replace('/(auth)/login'),
    },
  ]
);
=======
      console.log(
        'REGISTERED ROLE:',
        role
      );
>>>>>>> Stashed changes

      Alert.alert(
        'Registration successful',
        `Your MediVault account has been created as a ${role}.`
      );

      // Clear the form
      setFirstName('');
      setLastName('');
      setEmail('');
      setRole('');
      setPassword('');
      setShowRoles(false);
    } catch (error) {
      console.error(
        'REGISTER EXCEPTION:',
        error
      );

      Alert.alert(
        'Error',
        'Something went wrong while registering.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* Logo */}
      <Text style={styles.logo}>
        MediVault
      </Text>

      {/* Heading */}
      <Text style={styles.title}>
        Create Account
      </Text>

      <Text style={styles.subtitle}>
        Register as a healthcare worker
      </Text>

      {/* First Name */}
      <TextInput
        style={styles.input}
        placeholder="First name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
        editable={!loading}
      />

      {/* Last Name */}
      <TextInput
        style={styles.input}
        placeholder="Last name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
        editable={!loading}
      />

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!loading}
      />

      {/* Role Label */}
      <Text style={styles.roleLabel}>
        Register as
      </Text>

      {/* Role Dropdown */}
      <Pressable
        style={styles.dropdown}
        onPress={() => {
          if (!loading) {
            setShowRoles(!showRoles);
          }
        }}
      >
        <Text
          style={
            role
              ? styles.dropdownText
              : styles.placeholderText
          }
        >
          {role || 'Select your role'}
        </Text>

        <Text style={styles.arrow}>
          {showRoles ? '▲' : '▼'}
        </Text>
      </Pressable>

      {/* Dropdown Options */}
      {showRoles && (
        <View style={styles.dropdownList}>
          {roles.map((item) => (
            <Pressable
              key={item}
              style={styles.roleOption}
              onPress={() => {
                setRole(item);
                setShowRoles(false);
              }}
            >
              <Text style={styles.roleOptionText}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Password */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      {/* Create Account Button */}
      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.disabledButton,
        ]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      {/* Login Link */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>
          Already have an account?{' '}
        </Text>

        <Link
          href="/(auth)/login"
          style={styles.loginLink}
        >
          Sign In
        </Link>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },

  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 35,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 28,
  },

  input: {
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

  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 7,
  },

  dropdown: {
    height: 52,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownText: {
    fontSize: 16,
    color: '#0f172a',
  },

  placeholderText: {
    fontSize: 16,
    color: '#94a3b8',
  },

  arrow: {
    fontSize: 12,
    color: '#64748b',
  },

  dropdownList: {
    marginTop: -8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },

  roleOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  roleOptionText: {
    fontSize: 16,
    color: '#0f172a',
  },

  button: {
    height: 52,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  loginText: {
    fontSize: 15,
    color: '#64748b',
  },

  loginLink: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '600',
  },
});