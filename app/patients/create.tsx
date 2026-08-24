import { useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../../lib/supabase';

export default function CreatePatientScreen() {
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] =
    useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] =
    useState('');

  const [loading, setLoading] = useState(false);

  const handleCreatePatient = async () => {
    if (!idNumber || !firstName || !lastName) {
      Alert.alert(
        'Missing information',
        'ID number, first name and last name are required.'
      );
      return;
    }

    try {
      setLoading(true);

      // Get the currently logged-in user's session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        Alert.alert(
          'Authentication error',
          'Please log in again.'
        );
        return;
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-patient`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },

          body: JSON.stringify({
            id_number: idNumber,
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dateOfBirth || null,
            gender: gender || null,
            phone_number: phoneNumber || null,
            address: address || null,
            emergency_contact_name:
              emergencyContactName || null,
            emergency_contact_phone:
              emergencyContactPhone || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Failed',
          result.error || 'Could not create patient.'
        );
        return;
      }

      Alert.alert(
        'Success',
        'Patient created successfully.'
      );

      // Clear form
      setIdNumber('');
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setGender('');
      setPhoneNumber('');
      setAddress('');
      setEmergencyContactName('');
      setEmergencyContactPhone('');

    } catch (error) {
      console.error('CREATE PATIENT:', error);

      Alert.alert(
        'Error',
        'Something went wrong.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        Register Patient
      </Text>

      <Text style={styles.subtitle}>
        Enter the patient's information
      </Text>

      <TextInput
        style={styles.input}
        placeholder="South African ID Number *"
        value={idNumber}
        onChangeText={setIdNumber}
        keyboardType="numeric"
        maxLength={13}
      />

      <TextInput
        style={styles.input}
        placeholder="First Name *"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name *"
        value={lastName}
        onChangeText={setLastName}
      />

      <TextInput
        style={styles.input}
        placeholder="Date of Birth (YYYY-MM-DD)"
        value={dateOfBirth}
        onChangeText={setDateOfBirth}
      />

      <TextInput
        style={styles.input}
        placeholder="Gender"
        value={gender}
        onChangeText={setGender}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Address"
        value={address}
        onChangeText={setAddress}
        multiline
      />

      <TextInput
        style={styles.input}
        placeholder="Emergency Contact Name"
        value={emergencyContactName}
        onChangeText={setEmergencyContactName}
      />

      <TextInput
        style={styles.input}
        placeholder="Emergency Contact Phone"
        value={emergencyContactPhone}
        onChangeText={setEmergencyContactPhone}
        keyboardType="phone-pad"
      />

      <TouchableOpacity
        style={[
          styles.button,
          loading && styles.buttonDisabled,
        ]}
        onPress={handleCreatePatient}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating...' : 'Create Patient'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#ffffff',
    flexGrow: 1,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  button: {
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});