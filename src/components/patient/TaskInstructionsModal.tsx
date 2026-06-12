import React from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { styles } from './patientStyles';
import { getTaskMeta } from '../../utils/patientUtils';
import type { Task } from './RoutineCard';
import { getTaskIconInfo } from './RoutineCard';
import { Feather, Ionicons } from '@expo/vector-icons';
import { C } from '../../theme/colors';

type Props = {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
};

export const TaskInstructionsModal: React.FC<Props> = ({
  visible,
  task,
  onClose,
}) => {
  if (!task) return null;
  const meta = getTaskMeta(task.title);
  const iconInfo = getTaskIconInfo(task);

  const renderSteps = (instructionsMd: string | undefined) => {
    if (!instructionsMd) {
      return <Text style={styles.noStepsText}>No visual steps configured by caregiver.</Text>;
    }
    let steps: Array<{ text: string; photo_url?: string }> = [];
    try {
      if (instructionsMd.trim().startsWith('[')) {
        steps = JSON.parse(instructionsMd);
      } else {
        steps = [{ text: instructionsMd }];
      }
    } catch {
      steps = [{ text: instructionsMd }];
    }

    if (steps.length === 0 || (steps.length === 1 && !steps[0].text && !steps[0].photo_url)) {
      return <Text style={styles.noStepsText}>No visual steps configured by caregiver.</Text>;
    }

    return (
      <View style={styles.stepsContainer}>
        {steps.map((step, idx) => (
          <View key={idx} style={styles.stepRow}>
            <View style={styles.stepNumberCircle}>
              <Text style={styles.stepNumberText}>{idx + 1}</Text>
            </View>
            <View style={styles.stepContent}>
              {!!step.text && <Text style={styles.stepText}>{step.text}</Text>}
              {!!step.photo_url && (
                <Image
                  source={{ uri: step.photo_url }}
                  style={styles.stepPhoto}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.detailOverlay} onPress={onClose}>
        <Pressable
          style={[styles.detailSheet, { maxHeight: '85%', paddingBottom: 0 }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Fixed header */}
          <View style={styles.detailHeader}>
            <Pressable style={styles.detailCloseBtn} onPress={onClose}>
              <Text style={styles.detailCloseText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.detailIllustration}>
            {iconInfo.library === 'Feather' ? (
              <Feather name={iconInfo.name as any} size={46} color={C.primary} />
            ) : (
              <Ionicons name={iconInfo.name as any} size={46} color={C.primary} />
            )}
          </View>

          <Text style={styles.detailTitle}>{task.title}</Text>

          <View style={styles.detailMetaRow}>
            <View style={styles.detailPill}>
              <Text style={styles.detailPillText}>{task.time}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <Text style={styles.detailInstructionLabel}>VISUAL INSTRUCTION STEPS</Text>

          {/* Scrollable steps — grows to fill remaining sheet space */}
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 20 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            {renderSteps(task.instructionsMd)}
          </ScrollView>

          {/* Fixed footer button */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }}>
            <Pressable
              style={({ pressed }) => [styles.detailDoneBtn, { marginHorizontal: 0 }, pressed && { opacity: 0.85 }]}
              onPress={onClose}
            >
              <Text style={styles.detailDoneBtnText}>Got it</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
