import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { styles } from './patientStyles';
import type { CaregiverListing } from '../../screens/patient/CaregiverSearchView';

type Props = {
  visible: boolean;
  caregiver: CaregiverListing | null;
  onClose: () => void;
};

export const CaregiverProfileModal: React.FC<Props> = ({ visible, caregiver, onClose }) => {
  if (!caregiver) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.detailOverlay} onPress={onClose}>
        <Pressable style={styles.profileSheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.detailHeader}>
            <Pressable onPress={onClose} style={styles.detailCloseBtn}>
              <Text style={styles.detailCloseText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{caregiver.emoji}</Text>
          </View>

          <Text style={styles.caregiverTagline}>Your requested caregiver</Text>

          <Text style={styles.profileName}>{caregiver.name}</Text>
          <Text style={styles.profileSubtitle}>{caregiver.specialty}</Text>

          <View style={styles.detailDivider} />

          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Availability</Text>
            <Text style={styles.profileValue}>{caregiver.availability}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Location</Text>
            <Text style={styles.profileValue}>{caregiver.location}</Text>
          </View>
          <View style={styles.profileRow}>
            <Text style={styles.profileLabel}>Fee</Text>
            <Text style={styles.profileValue}>{caregiver.fee}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.detailDoneBtn, pressed && { opacity: 0.85 }]}
            onPress={onClose}
          >
            <Text style={styles.detailDoneBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
