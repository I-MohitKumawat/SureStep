/**
 * SureStep — src/components/caregiver/dashboard/DashboardManageTab.tsx
 * Extracted from CaregiverDashboardScreen.tsx lines 388–475 (Manage tab).
 * Owns: routine list + add/edit modal (modal state managed in parent).
 */
import React from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { mStyles } from "./dashboardStyles";
import { C } from "../../../theme/colors";
import type { Task } from "../../../context/TaskContext";

const ICON_OPTIONS = ["🍽️", "💊", "🚶", "🛁", "🛌", "🏋️", "🩺", "📖", "☕", "🧘", "🚗", "💧"];

type EditingTask = { id: string; title: string; description: string; time: string; icon: string; status: string };
type Form = { title: string; description: string; time: string; icon: string };

type Props = {
  patientName:       string;
  patientTasks:      Task[];
  manageLoading:     boolean;
  showRoutineModal:  boolean;
  editingRoutine:    EditingTask | null;
  form:              Form;
  formError:         string | null;
  saving:            boolean;
  onOpenAdd:         () => void;
  onOpenEdit:        (task: EditingTask) => void;
  onDelete:          (id: string) => void;
  onSave:            () => void;
  onCloseModal:      () => void;
  onFormChange:      (patch: Partial<Form>) => void;
};

export const DashboardManageTab: React.FC<Props> = ({
  patientName, patientTasks, manageLoading,
  showRoutineModal, editingRoutine, form, formError, saving,
  onOpenAdd, onOpenEdit, onDelete, onSave, onCloseModal, onFormChange,
}) => (
  <>
    <View style={mStyles.container}>
      <View style={mStyles.headerRow}>
        <View>
          <Text style={mStyles.title}>Daily Flow</Text>
          <Text style={mStyles.sub}>For {patientName}</Text>
        </View>
        <Pressable style={({ pressed }) => [mStyles.addBtn, pressed && { opacity: 0.85 }]} onPress={onOpenAdd}>
          <Text style={mStyles.addBtnPlus}>＋</Text>
          <Text style={mStyles.addBtnText}>Add Routine</Text>
        </Pressable>
      </View>

      {manageLoading ? (
        <Text style={mStyles.emptyText}>Loading…</Text>
      ) : patientTasks.length === 0 ? (
        <View style={mStyles.emptyWrap}>
          <Text style={mStyles.emptyEmoji}>📋</Text>
          <Text style={mStyles.emptyText}>No routines yet.</Text>
          <Text style={mStyles.emptyHint}>Tap "Add Routine" to get started.</Text>
        </View>
      ) : patientTasks.slice().sort((a, b) => a.time.localeCompare(b.time)).map(task => (
        <View key={task.id} style={mStyles.card}>
          <View style={mStyles.iconCircle}><Text style={mStyles.iconEmoji}>{task.icon ?? "📋"}</Text></View>
          <View style={mStyles.cardBody}>
            <View style={mStyles.cardTopRow}>
              <Text style={mStyles.cardTime}>{task.time}</Text>
              {task.status === "pending" && <View style={mStyles.pendingBadge}><Text style={mStyles.pendingText}>PENDING</Text></View>}
              {task.status === "done"    && <View style={[mStyles.pendingBadge, mStyles.doneBadge]}><Text style={[mStyles.pendingText, { color: C.primary }]}>DONE</Text></View>}
              {task.status === "missed"  && <View style={[mStyles.pendingBadge, mStyles.missedBadge]}><Text style={[mStyles.pendingText, { color: "#DC2626" }]}>MISSED</Text></View>}
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => onOpenEdit({ id: task.id, title: task.title, description: task.description ?? "", time: task.time, icon: task.icon ?? "📋", status: task.status })} hitSlop={10} style={({ pressed }) => [mStyles.actionBtn, pressed && { opacity: 0.55 }]}>
                <Text style={mStyles.editIcon}>✏️</Text>
              </Pressable>
              <Pressable onPress={() => void onDelete(task.id)} hitSlop={10} style={({ pressed }) => [mStyles.actionBtn, mStyles.deleteBtn, pressed && { opacity: 0.55 }]}>
                <Text style={mStyles.deleteIcon}>🗑</Text>
              </Pressable>
            </View>
            <Text style={mStyles.cardTitle}>{task.title}</Text>
            {!!task.description && <Text style={mStyles.cardDesc} numberOfLines={2}>{task.description}</Text>}
          </View>
        </View>
      ))}
    </View>

    {/* Add / Edit Modal */}
    <Modal visible={showRoutineModal} transparent animationType="slide" onRequestClose={onCloseModal}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <Pressable style={mStyles.modalOverlay} onPress={onCloseModal}>
          <Pressable style={mStyles.modalSheet} onPress={e => e.stopPropagation()}>
            <View style={mStyles.modalHandle} />
            <Text style={mStyles.modalTitle}>{editingRoutine ? "Edit Routine" : "New Routine"}</Text>
            <Text style={mStyles.fieldLabel}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={mStyles.iconPicker}>
              {ICON_OPTIONS.map(emoji => (
                <Pressable key={emoji} onPress={() => onFormChange({ icon: emoji })} style={[mStyles.iconOption, form.icon === emoji && mStyles.iconOptionActive]}>
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={mStyles.fieldLabel}>Title *</Text>
            <TextInput style={mStyles.input} placeholder="e.g. Morning Medication" placeholderTextColor={C.textMuted} value={form.title} onChangeText={v => onFormChange({ title: v })} returnKeyType="next" />
            <Text style={mStyles.fieldLabel}>Description</Text>
            <TextInput style={[mStyles.input, mStyles.inputMulti]} placeholder="e.g. Blood pressure tablet + Vitamins" placeholderTextColor={C.textMuted} value={form.description} onChangeText={v => onFormChange({ description: v })} multiline numberOfLines={3} />
            <Text style={mStyles.fieldLabel}>Time (HH:MM) *</Text>
            <TextInput style={mStyles.input} placeholder="08:00" placeholderTextColor={C.textMuted} value={form.time} onChangeText={v => onFormChange({ time: v })} keyboardType="numbers-and-punctuation" maxLength={5} />
            {!!formError && <Text style={mStyles.formError}>{formError}</Text>}
            <Pressable style={({ pressed }) => [mStyles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]} onPress={onSave} disabled={saving}>
              <Text style={mStyles.saveBtnText}>{saving ? "Saving…" : editingRoutine ? "Save Changes" : "Add Routine"}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  </>
);
