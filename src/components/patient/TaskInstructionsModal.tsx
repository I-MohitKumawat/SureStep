import React from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export interface TaskInstructionData {
  id?: string;
  title: string;
  time?: string;
  scheduled_time?: string;
  instructionsMd?: string | null;
  instructions_md?: string | null;
  description?: string | null;
  photo_url?: string | null;
}

type Props = {
  visible: boolean;
  task: TaskInstructionData | null;
  onClose: () => void;
};

export const TaskInstructionsModal: React.FC<Props> = ({
  visible,
  task,
  onClose,
}) => {
  const { mode } = useTheme();
  if (!task) return null;

  const rawInstructions =
    task.instructionsMd ||
    task.instructions_md ||
    task.description ||
    '';

  const timeDisplay = task.time || task.scheduled_time || '';

  const renderSteps = (instructions: string) => {
    if (!instructions || !instructions.trim()) {
      return (
        <View className="py-6 items-center justify-center">
          <Text
            className="text-sm font-medium text-center"
            style={{ color: mode === 'dark' ? '#9EABA7' : '#52605D' }}
          >
            No step-by-step instructions configured.
          </Text>
        </View>
      );
    }

    let steps: Array<{ text: string; photo_url?: string }> = [];
    try {
      if (instructions.trim().startsWith('[')) {
        steps = JSON.parse(instructions);
      } else {
        steps = [{ text: instructions }];
      }
    } catch {
      steps = [{ text: instructions }];
    }

    if (steps.length === 0 || (steps.length === 1 && !steps[0].text && !steps[0].photo_url)) {
      return (
        <View className="py-6 items-center justify-center">
          <Text
            className="text-sm font-medium text-center"
            style={{ color: mode === 'dark' ? '#9EABA7' : '#52605D' }}
          >
            No step-by-step instructions configured.
          </Text>
        </View>
      );
    }

    return (
      <View className="gap-3 mt-2">
        {steps.map((step, idx) => (
          <View
            key={idx}
            className="flex-row items-start p-3 rounded-2xl border border-[#E5E0D8] dark:border-[#2C3835] bg-[#FAF8F5] dark:bg-[#121816]"
          >
            <View className="w-7 h-7 rounded-full bg-[#0E7A67] items-center justify-center mr-3 mt-0.5">
              <Text className="text-white text-xs font-bold">{idx + 1}</Text>
            </View>
            <View className="flex-1">
              {!!step.text && (
                <Text
                  className="text-sm font-medium leading-5"
                  style={{ color: mode === 'dark' ? '#F5F7F6' : '#161E1C' }}
                >
                  {step.text}
                </Text>
              )}
              {!!step.photo_url && (
                <Image
                  source={{ uri: step.photo_url }}
                  className="w-full h-40 rounded-xl mt-2"
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
      <Pressable
        className="flex-1 justify-end bg-black/50"
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-3xl max-h-[85%] border-t border-[#E5E0D8] dark:border-[#2C3835] bg-white dark:bg-[#1C2422]"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
            <View className="w-8" />
            <Text
              className="text-base font-extrabold"
              style={{ color: mode === 'dark' ? '#F5F7F6' : '#161E1C' }}
            >
              Routine Instructions
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full items-center justify-center bg-[#FAF8F5] dark:bg-[#121816]"
            >
              <Text className="text-sm font-bold text-[#52605D] dark:text-[#9EABA7]">✕</Text>
            </Pressable>
          </View>

          {/* Title & Time */}
          <View className="px-5 py-2">
            <Text
              className="text-xl font-extrabold tracking-tight"
              style={{ color: mode === 'dark' ? '#F5F7F6' : '#161E1C' }}
            >
              {task.title}
            </Text>
            {!!timeDisplay && (
              <View className="self-start px-2.5 py-1 rounded-full bg-[#E6F4F1] dark:bg-[#16332D] mt-2">
                <Text className="text-xs font-bold text-[#0E7A67] dark:text-[#b1f3da]">
                  {timeDisplay}
                </Text>
              </View>
            )}
          </View>

          <View className="h-px bg-[#E5E0D8] dark:bg-[#2C3835] mx-5 my-2" />

          {/* Scrollable steps */}
          <ScrollView
            className="flex-1 px-5"
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
          >
            <Text
              className="text-xs font-bold tracking-wider uppercase mb-1"
              style={{ color: mode === 'dark' ? '#9EABA7' : '#52605D' }}
            >
              STEPS
            </Text>
            {renderSteps(rawInstructions)}
          </ScrollView>

          {/* Got it CTA */}
          <View className="px-5 pt-3 pb-8">
            <Pressable
              onPress={onClose}
              className="w-full py-3.5 rounded-2xl items-center justify-center bg-[#0E7A67]"
              style={({ pressed }) => [pressed && { opacity: 0.85 }]}
            >
              <Text className="text-white font-extrabold text-base">Got it</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
