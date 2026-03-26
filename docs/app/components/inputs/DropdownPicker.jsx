import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../../packages/ui/theme/ThemeProvider';

export default function DropdownPicker({
  label,
  items,
  value,
  onValueChange,
  error,
  required,
  placeholder = 'Select…',
  searchable = false,
  highContrast = false,
  minFontSize = 14
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const theme = useTheme();

  const selected = React.useMemo(() => items.find((i) => i.value === value) ?? null, [items, value]);

  const filtered = React.useMemo(() => {
    if (!searchable || !query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query, searchable]);

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, highContrast && styles.labelHighContrast, { fontSize: Math.max(minFontSize, 13) }]}>
        {label}
        {required ? ' *' : ''}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          highContrast && styles.triggerHighContrast,
          !highContrast && {
            borderColor: theme.colors.borderSubtle,
            backgroundColor: theme.colors.surface
          },
          { minHeight: 48, justifyContent: 'center' }
        ]}
      >
        <Text
          style={[
            styles.triggerText,
            highContrast && styles.triggerTextHighContrast,
            !highContrast && { color: theme.colors.textPrimary },
            { fontSize: Math.max(minFontSize, 14) }
          ]}
        >
          {selected ? selected.label : placeholder}
        </Text>
      </Pressable>

      {error ? <Text style={[styles.errorText, highContrast && styles.errorTextHighContrast]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)} />
        <View style={[styles.modalSheet, highContrast && styles.modalSheetHighContrast, !highContrast && { backgroundColor: theme.colors.surface }]}>
          {searchable ? (
            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search…"
                placeholderTextColor={highContrast ? '#9ca3af' : theme.colors.textSecondary}
                style={[
                  styles.searchInput,
                  highContrast && styles.searchInputHighContrast,
                  !highContrast && {
                    borderColor: theme.colors.borderSubtle,
                    color: theme.colors.textPrimary,
                    backgroundColor: theme.colors.surface
                  }
                ]}
              />
            </View>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.value)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onValueChange(item.value);
                  setOpen(false);
                  setQuery('');
                }}
                style={({ pressed }) => [
                  styles.itemRow,
                  highContrast && styles.itemRowHighContrast,
                  !highContrast && { borderBottomColor: theme.colors.borderSubtle },
                  pressed && styles.itemRowPressed
                ]}
              >
                <Text style={[styles.itemLabel, highContrast && styles.itemLabelHighContrast, !highContrast && { color: theme.colors.textPrimary }]}>
                  {item.label}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={{ padding: 16 }}>
                <Text style={[styles.emptyText, highContrast && styles.emptyTextHighContrast, !highContrast && { color: theme.colors.textSecondary }]}>
                  No matches.
                </Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 12
  },
  label: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6
  },
  labelHighContrast: {
    color: '#ffffff'
  },
  trigger: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff'
  },
  triggerHighContrast: {
    borderColor: '#ffffff',
    backgroundColor: '#000000'
  },
  triggerText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600'
  },
  triggerTextHighContrast: {
    color: '#ffffff'
  },
  errorText: {
    marginTop: 6,
    color: '#dc2626',
    fontSize: 12,
    lineHeight: 16
  },
  errorTextHighContrast: {
    color: '#fecaca'
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)'
  },
  modalSheet: {
    marginTop: 72,
    marginHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    maxHeight: '80%'
  },
  modalSheetHighContrast: {
    backgroundColor: '#000000'
  },
  searchRow: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#111827',
    backgroundColor: '#ffffff'
  },
  searchInputHighContrast: {
    borderColor: '#ffffff',
    color: '#ffffff',
    backgroundColor: '#000000'
  },
  itemRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb'
  },
  itemRowHighContrast: {
    borderBottomColor: '#1f2933'
  },
  itemRowPressed: {
    backgroundColor: '#eff6ff'
  },
  itemLabel: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14
  },
  itemLabelHighContrast: {
    color: '#ffffff'
  },
  emptyText: {
    color: '#6b7280'
  },
  emptyTextHighContrast: {
    color: '#9ca3af'
  }
});

