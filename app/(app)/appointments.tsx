
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { useState } from 'react';
import { router } from 'expo-router';

type Appointment = {
  id: string;
  patient: string;
  date: string;
  time: string;
  type: string;
  facility: string;
  reason: string;
};

export default function AppointmentsScreen() {
  const { width } = useWindowDimensions();

  // =====================================================
  // RESPONSIVE SETTINGS
  // =====================================================

  const isSmallPhone = width < 380;
  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 900;
  const isDesktop = width >= 900;

  // =====================================================
  // FORM STATE
  // =====================================================

  const [patient, setPatient] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [facility, setFacility] = useState('');
  const [reason, setReason] = useState('');

  // =====================================================
  // CALENDAR STATE
  // =====================================================

  const today = new Date();

  const [showCalendar, setShowCalendar] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(
    today.getMonth()
  );

  const [calendarYear, setCalendarYear] = useState(
    today.getFullYear()
  );

  // =====================================================
  // TIME PICKER STATE
  // =====================================================

  const [showTimePicker, setShowTimePicker] = useState(false);

  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  // =====================================================
  // APPOINTMENTS
  // =====================================================

  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      patient: 'Patient #CL-10024',
      date: '18 September 2026',
      time: '09:00 AM',
      type: 'General Consultation',
      facility: 'Durban Central',
      reason: 'General consultation',
    },
    {
      id: '2',
      patient: 'Patient #CL-10031',
      date: '19 September 2026',
      time: '10:30 AM',
      type: 'Follow-up',
      facility: 'King Edward VIII',
      reason: 'Follow-up consultation',
    },
    {
      id: '3',
      patient: 'Patient #CL-10045',
      date: '22 September 2026',
      time: '02:00 PM',
      type: 'Specialist',
      facility: 'Addington',
      reason: 'Specialist consultation',
    },
  ]);

  // =====================================================
  // DATE HELPERS
  // =====================================================

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const weekDays = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  const getDaysInMonth = (
    year: number,
    month: number
  ) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (
    year: number,
    month: number
  ) => {
    return new Date(year, month, 1).getDay();
  };

  const isPastDate = (
    year: number,
    month: number,
    day: number
  ) => {
    const selectedDate = new Date(
      year,
      month,
      day
    );

    const currentDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return selectedDate < currentDate;
  };

  const formatDate = (
    year: number,
    month: number,
    day: number
  ) => {
    const selectedDate = new Date(
      year,
      month,
      day
    );

    return selectedDate.toLocaleDateString(
      'en-ZA',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    );
  };

  // =====================================================
  // OPEN CALENDAR
  // =====================================================

  const openCalendar = () => {
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
    setShowCalendar(true);
  };

  // =====================================================
  // SELECT DATE
  // =====================================================

  const selectDate = (
    year: number,
    month: number,
    day: number
  ) => {
    if (isPastDate(year, month, day)) {
      Alert.alert(
        'Invalid date',
        'You cannot schedule an appointment for a date in the past.'
      );
      return;
    }

    const formattedDate = formatDate(
      year,
      month,
      day
    );

    setDate(formattedDate);
    setShowCalendar(false);
  };

  // =====================================================
  // CHANGE MONTH
  // =====================================================

  const previousMonth = () => {
    const newDate = new Date(
      calendarYear,
      calendarMonth - 1,
      1
    );

    const currentMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    if (newDate < currentMonth) {
      return;
    }

    setCalendarMonth(newDate.getMonth());
    setCalendarYear(newDate.getFullYear());
  };

  const nextMonth = () => {
    const newDate = new Date(
      calendarYear,
      calendarMonth + 1,
      1
    );

    setCalendarMonth(newDate.getMonth());
    setCalendarYear(newDate.getFullYear());
  };

  // =====================================================
  // TIME HELPERS
  // =====================================================

  const convertTo24Hour = (
    hour: number,
    period: 'AM' | 'PM'
  ) => {
    if (period === 'AM') {
      return hour === 12 ? 0 : hour;
    }

    return hour === 12 ? 12 : hour + 12;
  };

  const isSelectedTimeInPast = () => {
    if (!date) {
      return false;
    }

    const selectedDate = new Date(date);

    if (isNaN(selectedDate.getTime())) {
      return false;
    }

    const selectedHour24 = convertTo24Hour(
      Number(selectedHour),
      selectedPeriod
    );

    const appointmentDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedHour24,
      Number(selectedMinute)
    );

    return appointmentDateTime <= new Date();
  };

  const confirmTime = () => {
    if (isSelectedTimeInPast()) {
      Alert.alert(
        'Invalid time',
        'Please select a future time for the appointment.'
      );
      return;
    }

    setTime(
      `${selectedHour}:${selectedMinute} ${selectedPeriod}`
    );

    setShowTimePicker(false);
  };

  // =====================================================
  // VALIDATE FORM
  // =====================================================

  const validateForm = () => {
    if (!patient.trim()) {
      Alert.alert(
        'Patient required',
        'Please enter the patient ID or patient name.'
      );
      return false;
    }

    if (!date) {
      Alert.alert(
        'Date required',
        'Please select an appointment date.'
      );
      return false;
    }

    if (!time) {
      Alert.alert(
        'Time required',
        'Please select an appointment time.'
      );
      return false;
    }

    if (!appointmentType) {
      Alert.alert(
        'Appointment type required',
        'Please select an appointment type.'
      );
      return false;
    }

    if (!facility) {
      Alert.alert(
        'Facility required',
        'Please select a healthcare facility.'
      );
      return false;
    }

    return true;
  };

  // =====================================================
  // CREATE APPOINTMENT
  // =====================================================

  const handleCreateAppointment = () => {
    if (!validateForm()) {
      return;
    }

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      patient: patient.trim(),
      date,
      time,
      type: appointmentType,
      facility,
      reason: reason.trim() || 'No additional notes',
    };

    setAppointments((current) => [
      newAppointment,
      ...current,
    ]);

    Alert.alert(
      'Appointment Created',
      'The appointment has been successfully scheduled.'
    );

    // Clear form
    setPatient('');
    setDate('');
    setTime('');
    setAppointmentType('');
    setFacility('');
    setReason('');
  };

  // =====================================================
  // CALENDAR DAYS
  // =====================================================

  const daysInMonth = getDaysInMonth(
    calendarYear,
    calendarMonth
  );

  const firstDay = getFirstDayOfMonth(
    calendarYear,
    calendarMonth
  );

  const calendarDays = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isSmallPhone &&
            styles.scrollContentSmall,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View
          style={[
            styles.header,
            isDesktop && styles.headerDesktop,
          ]}
        >
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() =>
                router.replace(
                  '/(app)/dashboard'
                )
              }
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>
                ‹
              </Text>
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
              <Text
                style={[
                  styles.pageTitle,
                  isSmallPhone &&
                    styles.pageTitleSmall,
                ]}
              >
                Appointments
              </Text>

              <Text
                style={[
                  styles.pageSubtitle,
                  isSmallPhone &&
                    styles.pageSubtitleSmall,
                ]}
              >
                Schedule and manage patient
                appointments
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================= */}
        {/* MAIN CONTENT */}
        {/* ================================================= */}

        <View
          style={[
            styles.content,
            isTablet && styles.contentTablet,
            isDesktop && styles.contentDesktop,
          ]}
        >
          {/* ================================================= */}
          {/* CREATE APPOINTMENT */}
          {/* ================================================= */}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                Create Appointment
              </Text>

              <Text style={styles.cardSubtitle}>
                Enter the appointment details below.
              </Text>
            </View>

            {/* PATIENT */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Patient{' '}
                <Text style={styles.required}>
                  *
                </Text>
              </Text>

              <TextInput
                style={[
                  styles.input,
                  isSmallPhone &&
                    styles.inputSmall,
                ]}
                placeholder="Enter patient ID or name"
                placeholderTextColor="#94a3b8"
                value={patient}
                onChangeText={setPatient}
                autoCapitalize="none"
              />

              <Text style={styles.helperText}>
                Enter the patient's registered ID
                or full name.
              </Text>
            </View>

            {/* DATE + TIME */}
            <View
              style={[
                styles.row,
                isPhone &&
                  styles.rowMobile,
              ]}
            >
              {/* DATE */}
              <View style={styles.rowField}>
                <Text style={styles.label}>
                  Appointment Date{' '}
                  <Text style={styles.required}>
                    *
                  </Text>
                </Text>

                <TouchableOpacity
                  style={[
                    styles.selectInput,
                    isSmallPhone &&
                      styles.inputSmall,
                  ]}
                  onPress={openCalendar}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectText,
                      !date &&
                        styles.placeholderText,
                    ]}
                  >
                    {date || 'Select date'}
                  </Text>

                  <Text style={styles.calendarIcon}>
                    ▣
                  </Text>
                </TouchableOpacity>
              </View>

              {/* TIME */}
              <View style={styles.rowField}>
                <Text style={styles.label}>
                  Appointment Time{' '}
                  <Text style={styles.required}>
                    *
                  </Text>
                </Text>

                <TouchableOpacity
                  style={[
                    styles.selectInput,
                    isSmallPhone &&
                      styles.inputSmall,
                  ]}
                  onPress={() =>
                    setShowTimePicker(true)
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.selectText,
                      !time &&
                        styles.placeholderText,
                    ]}
                  >
                    {time || 'Select time'}
                  </Text>

                  <Text style={styles.timeIcon}>
                    ◷
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* APPOINTMENT TYPE */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Appointment Type{' '}
                <Text style={styles.required}>
                  *
                </Text>
              </Text>

              <View
                style={[
                  styles.optionsRow,
                  isPhone &&
                    styles.optionsMobile,
                ]}
              >
                {[
                  'General Consultation',
                  'Follow-up',
                  'Specialist',
                ].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      appointmentType === type &&
                        styles.optionButtonSelected,
                    ]}
                    onPress={() =>
                      setAppointmentType(type)
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        appointmentType === type &&
                          styles.optionTextSelected,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* FACILITY */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Healthcare Facility{' '}
                <Text style={styles.required}>
                  *
                </Text>
              </Text>

              <View style={styles.facilityOptions}>
                {[
                  'Durban Central',
                  'King Edward VIII',
                  'Addington',
                ].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.facilityButton,
                      facility === item &&
                        styles.facilityButtonSelected,
                    ]}
                    onPress={() =>
                      setFacility(item)
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.facilityText,
                        facility === item &&
                          styles.facilityTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* REASON */}
            <View style={styles.field}>
              <Text style={styles.label}>
                Reason / Notes
              </Text>

              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  isSmallPhone &&
                    styles.inputSmall,
                ]}
                placeholder="Enter appointment reason or additional notes"
                placeholderTextColor="#94a3b8"
                value={reason}
                onChangeText={setReason}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* ACTION BUTTONS */}
            <View
              style={[
                styles.actionRow,
                isPhone &&
                  styles.actionMobile,
              ]}
            >
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() =>
                  router.replace(
                    '/(app)/dashboard'
                  )
                }
                activeOpacity={0.8}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateAppointment}
                activeOpacity={0.8}
              >
                <Text style={styles.createButtonText}>
                  Create Appointment
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ================================================= */}
          {/* UPCOMING APPOINTMENTS */}
          {/* ================================================= */}

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.listHeaderText}>
                <Text style={styles.cardTitle}>
                  Upcoming Appointments
                </Text>

                <Text style={styles.cardSubtitle}>
                  View scheduled patient appointments.
                </Text>
              </View>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {appointments.length}
                </Text>
              </View>
            </View>

            {appointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  No appointments
                </Text>

                <Text style={styles.emptyText}>
                  There are currently no upcoming
                  appointments.
                </Text>
              </View>
            ) : (
              appointments.map((appointment) => (
                <View
                  key={appointment.id}
                  style={[
                    styles.appointmentCard,
                    isSmallPhone &&
                      styles.appointmentCardSmall,
                  ]}
                >
                  {/* DATE */}
                  <View style={styles.appointmentDate}>
                    <Text style={styles.dateDay}>
                      {appointment.date
                        .split(' ')[0]
                        .replace(/^0/, '')}
                    </Text>

                    <Text
                      style={styles.dateMonth}
                    >
                      {appointment.date
                        .split(' ')[1]
                        ?.substring(0, 3)
                        .toUpperCase()}
                    </Text>
                  </View>

                  {/* INFO */}
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.patientName}>
                      {appointment.patient}
                    </Text>

                    <Text
                      style={styles.appointmentDetails}
                    >
                      {appointment.type}
                    </Text>

                    <Text
                      style={styles.appointmentDetails}
                    >
                      {appointment.facility} •{' '}
                      {appointment.time}
                    </Text>
                  </View>

                  {/* STATUS */}
                  {!isSmallPhone && (
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        Scheduled
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* ================================================= */}
      {/* CALENDAR MODAL */}
      {/* ================================================= */}

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowCalendar(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.calendarModal,
              isSmallPhone &&
                styles.calendarModalSmall,
            ]}
          >
            {/* CALENDAR HEADER */}
            <View style={styles.calendarHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Select Appointment Date
                </Text>

                <Text style={styles.modalSubtitle}>
                  Choose a date for the appointment
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  setShowCalendar(false)
                }
              >
                <Text style={styles.closeText}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            {/* MONTH NAVIGATION */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity
                style={styles.monthArrow}
                onPress={previousMonth}
              >
                <Text style={styles.monthArrowText}>
                  ‹
                </Text>
              </TouchableOpacity>

              <Text style={styles.monthTitle}>
                {monthNames[calendarMonth]}{' '}
                {calendarYear}
              </Text>

              <TouchableOpacity
                style={styles.monthArrow}
                onPress={nextMonth}
              >
                <Text style={styles.monthArrowText}>
                  ›
                </Text>
              </TouchableOpacity>
            </View>

            {/* WEEK DAYS */}
            <View style={styles.weekRow}>
              {weekDays.map((day) => (
                <Text
                  key={day}
                  style={styles.weekDay}
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* CALENDAR */}
            <View style={styles.calendarGrid}>
              {calendarDays.map(
                (day, index) => {
                  if (day === null) {
                    return (
                      <View
                        key={`empty-${index}`} 
                        style={styles.calendarDay}
                      />
                    );
                  }

                  const past = isPastDate(
                    calendarYear,
                    calendarMonth,
                    day
                  );

                  const isToday =
                    day === today.getDate() &&
                    calendarMonth ===
                      today.getMonth() &&
                    calendarYear ===
                      today.getFullYear();

                  return (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.calendarDay,
                        isToday &&
                          styles.todayDay,
                        past &&
                          styles.pastDay,
                      ]}
                      onPress={() =>
                        selectDate(
                          calendarYear,
                          calendarMonth,
                          day
                        )
                      }
                      disabled={past}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          isToday &&
                            styles.todayText,
                          past &&
                            styles.pastDayText,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>

            {/* CALENDAR FOOTER */}
            <TouchableOpacity
              style={styles.closeCalendarButton}
              onPress={() =>
                setShowCalendar(false)
              }
            >
              <Text
                style={styles.closeCalendarText}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* TIME PICKER MODAL */}
      {/* ================================================= */}

      <Modal
        visible={showTimePicker}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setShowTimePicker(false)
        }
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.timeModal,
              isSmallPhone &&
                styles.timeModalSmall,
            ]}
          >
            {/* HEADER */}
            <View style={styles.calendarHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Select Appointment Time
                </Text>

                <Text style={styles.modalSubtitle}>
                  Choose the appointment time
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() =>
                  setShowTimePicker(false)
                }
              >
                <Text style={styles.closeText}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            {/* TIME DISPLAY */}
            <View style={styles.timeDisplay}>
              <Text style={styles.timeDisplayText}>
                {selectedHour}:
                {selectedMinute}{' '}
                {selectedPeriod}
              </Text>
            </View>

            {/* HOUR */}
            <Text style={styles.timeLabel}>
              Hour
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.timeOptions
              }
            >
              {Array.from(
                { length: 12 },
                (_, index) => {
                  const hour = String(
                    index + 1
                  ).padStart(2, '0');

                  return (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        selectedHour === hour &&
                          styles.timeOptionSelected,
                      ]}
                      onPress={() =>
                        setSelectedHour(hour)
                      }
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          selectedHour ===
                            hour &&
                            styles.timeOptionTextSelected,
                        ]}
                      >
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </ScrollView>

            {/* MINUTES */}
            <Text style={styles.timeLabel}>
              Minutes
            </Text>

            <View style={styles.minuteOptions}>
              {['00', '15', '30', '45'].map(
                (minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.minuteButton,
                      selectedMinute ===
                        minute &&
                        styles.timeOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedMinute(
                        minute
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        selectedMinute ===
                          minute &&
                          styles.timeOptionTextSelected,
                      ]}
                    >
                      {minute}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* AM / PM */}
            <Text style={styles.timeLabel}>
              Period
            </Text>

            <View style={styles.periodOptions}>
              {(['AM', 'PM'] as const).map(
                (period) => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodButton,
                      selectedPeriod ===
                        period &&
                        styles.timeOptionSelected,
                    ]}
                    onPress={() =>
                      setSelectedPeriod(
                        period
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        selectedPeriod ===
                          period &&
                          styles.timeOptionTextSelected,
                      ]}
                    >
                      {period}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* ACTIONS */}
            <View style={styles.timeActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() =>
                  setShowTimePicker(false)
                }
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createButton}
                onPress={confirmTime}
              >
                <Text
                  style={styles.createButtonText}
                >
                  Confirm Time
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
  // =====================================================
  // MAIN
  // =====================================================

  container: {
    flex: 1,
    backgroundColor: '#f7faff',
  },

  scrollContent: {
    padding: 24,
    paddingBottom: 50,
  },

  scrollContentSmall: {
    padding: 16,
    paddingBottom: 35,
  },

  // =====================================================
  // HEADER
  // =====================================================

  header: {
    width: '100%',
    marginBottom: 24,
  },

  headerDesktop: {
    marginBottom: 28,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerTextContainer: {
    flex: 1,
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
    marginRight: 14,
  },

  backArrow: {
    fontSize: 32,
    color: '#154581',
    lineHeight: 34,
    marginTop: -3,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#123b6d',
  },

  pageTitleSmall: {
    fontSize: 23,
  },

  pageSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },

  pageSubtitleSmall: {
    fontSize: 12,
  },

  // =====================================================
  // CONTENT
  // =====================================================

  content: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },

  contentTablet: {
    maxWidth: 800,
  },

  contentDesktop: {
    maxWidth: 1000,
  },

  // =====================================================
  // CARD
  // =====================================================

  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dce6f2',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,

    ...Platform.select({
      web: {
        boxShadow:
          '0px 2px 6px rgba(21, 69, 129, 0.06)',
      },
      default: {
        elevation: 2,
      },
    }),
  },

  cardHeader: {
    marginBottom: 24,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  listHeaderText: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#123b6d',
  },

  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 5,
    lineHeight: 19,
  },

  // =====================================================
  // FORM
  // =====================================================

  field: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },

  required: {
    color: '#dc2626',
  },

  helperText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 5,
  },

  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#dbe6f3',
    borderRadius: 9,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    color: '#123b6d',
    fontSize: 15,
  },

  inputSmall: {
    height: 48,
    fontSize: 14,
    paddingHorizontal: 12,
  },

  textArea: {
    height: 100,
    paddingTop: 14,
  },

  // =====================================================
  // DATE / TIME SELECT
  // =====================================================

  selectInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#dbe6f3',
    borderRadius: 9,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectText: {
    color: '#123b6d',
    fontSize: 14,
    flex: 1,
  },

  placeholderText: {
    color: '#94a3b8',
  },

  calendarIcon: {
    color: '#154581',
    fontSize: 18,
    marginLeft: 8,
  },

  timeIcon: {
    color: '#154581',
    fontSize: 20,
    marginLeft: 8,
  },

  // =====================================================
  // ROW
  // =====================================================

  row: {
    flexDirection: 'row',
    gap: 16,
  },

  rowMobile: {
    flexDirection: 'column',
    gap: 0,
  },

  rowField: {
    flex: 1,
  },

  // =====================================================
  // APPOINTMENT TYPE
  // =====================================================

  optionsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  optionsMobile: {
    flexDirection: 'column',
  },

  optionButton: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: '#dbe6f3',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },

  optionButtonSelected: {
    backgroundColor: '#154581',
    borderColor: '#154581',
  },

  optionText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },

  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // =====================================================
  // FACILITY
  // =====================================================

  facilityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  facilityButton: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#dbe6f3',
    borderRadius: 9,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },

  facilityButtonSelected: {
    backgroundColor: '#eaf2fb',
    borderColor: '#154581',
  },

  facilityText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
  },

  facilityTextSelected: {
    color: '#154581',
    fontWeight: '700',
  },

  // =====================================================
  // ACTION BUTTONS
  // =====================================================

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },

  actionMobile: {
    flexDirection: 'column-reverse',
  },

  cancelButton: {
    minWidth: 110,
    height: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  cancelText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },

  createButton: {
    minWidth: 170,
    height: 48,
    borderRadius: 9,
    backgroundColor: '#154581',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },

  // =====================================================
  // APPOINTMENT LIST
  // =====================================================

  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eaf2fb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  countText: {
    color: '#154581',
    fontSize: 13,
    fontWeight: '700',
  },

  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
  },

  appointmentCardSmall: {
    alignItems: 'flex-start',
  },

  appointmentDate: {
    width: 58,
    height: 58,
    borderRadius: 9,
    backgroundColor: '#eaf2fb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: '#154581',
  },

  dateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1,
  },

  appointmentInfo: {
    flex: 1,
  },

  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#123b6d',
    marginBottom: 4,
  },

  appointmentDetails: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#eaf2fb',
    marginLeft: 10,
  },

  statusText: {
    color: '#154581',
    fontSize: 11,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#123b6d',
  },

  emptyText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 5,
    textAlign: 'center',
  },

  // =====================================================
  // MODAL
  // =====================================================

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  calendarModal: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 22,
  },

  calendarModalSmall: {
    padding: 16,
  },

  timeModal: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 22,
  },

  timeModalSmall: {
    padding: 16,
  },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#123b6d',
  },

  modalSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  closeText: {
    fontSize: 24,
    color: '#64748b',
    lineHeight: 25,
  },

  // =====================================================
  // CALENDAR
  // =====================================================

  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 15,
  },

  monthArrow: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#eaf2fb',
    justifyContent: 'center',
    alignItems: 'center',
  },

  monthArrowText: {
    fontSize: 27,
    color: '#154581',
    lineHeight: 29,
  },

  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#123b6d',
  },

  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },

  weekDay: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    paddingVertical: 7,
  },

  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  calendarDay: {
    width: '14.285%',
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },

  calendarDayText: {
    fontSize: 14,
    color: '#334155',
  },

  todayDay: {
    backgroundColor: '#eaf2fb',
  },

  todayText: {
    color: '#154581',
    fontWeight: '700',
  },

  pastDay: {
    opacity: 0.35,
  },

  pastDayText: {
    color: '#94a3b8',
  },

  closeCalendarButton: {
    height: 46,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },

  closeCalendarText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },

  // =====================================================
  // TIME PICKER
  // =====================================================

  timeDisplay: {
    backgroundColor: '#eaf2fb',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 18,
  },

  timeDisplayText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#154581',
  },

  timeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 8,
  },

  timeOptions: {
    gap: 8,
    paddingVertical: 2,
  },

  timeOption: {
    width: 48,
    height: 42,
    borderWidth: 1,
    borderColor: '#dbe6f3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  timeOptionSelected: {
    backgroundColor: '#154581',
    borderColor: '#154581',
  },

  timeOptionText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },

  timeOptionTextSelected: {
    color: '#ffffff',
  },

  minuteOptions: {
    flexDirection: 'row',
    gap: 8,
  },

  minuteButton: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#dbe6f3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  periodOptions: {
    flexDirection: 'row',
    gap: 10,
  },

  periodButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#dbe6f3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  timeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 22,
  },
});

