import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { styles } from './patientStyles';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSearch: () => void;
};

export const UnlinkedCaregiverModal: React.FC<Props> = ({
  visible,
  onClose,
  onSearch,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.alertOverlay}>
      <View style={styles.alertCard}>
        <View style={styles.alertIconWrap}>
          <Text style={styles.alertIcon}>🤝</Text>
        </View>
        <Text style={styles.alertTitle}>Find a Caregiver</Text>
        <Text style={styles.alertMessage}>
          You don't have a confirmed caregiver linked yet. Would you like to search for an experienced caregiver nearby?
        </Text>
        <View style={styles.alertBtnRow}>
          <Pressable
            style={({ pressed }) => [styles.alertCancelBtn, pressed && styles.alertBtnPressed]}
            onPress={onClose}
          >
            <Text style={styles.alertCancelText}>Later</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.alertConfirmBtn, pressed && styles.alertBtnPressed]}
            onPress={onSearch}
          >
            <Text style={styles.alertConfirmText}>Search Nearby</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);
