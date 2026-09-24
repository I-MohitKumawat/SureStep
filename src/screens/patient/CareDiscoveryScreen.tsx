import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import { CaregiverCard } from '../../components/discovery/CaregiverCard';
import {
  DEFAULT_FILTERS,
  DiscoveryFilterModal,
  type FilterState,
} from '../../components/discovery/DiscoveryFilterModal';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchCaregiversDiscovery,
  type CaregiverListing,
} from '../../services/relationshipService';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { PatientStackParams } from '../../types/navigation.types';

type NavigationProp = NativeStackNavigationProp<PatientStackParams, 'CareDiscoveryScreen'>;
type ScreenRouteProp = RouteProp<PatientStackParams, 'CareDiscoveryScreen'>;

interface QuickPill {
  key: string;
  label: string;
}

const QUICK_PILLS: QuickPill[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'Newest' },
  { key: 'dementia', label: 'Dementia Care' },
  { key: 'nurse', label: 'Clinical / Nurse' },
  { key: 'elder', label: 'Elder Care' },
  { key: 'day', label: 'Day Shifts' },
  { key: 'overnight', label: 'Overnight' },
];

export const CareDiscoveryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { user } = useAuth();

  const targetPatientId = route.params?.targetPatientId;
  const targetPatientName = route.params?.targetPatientName;

  // Search & Filter State
  const [query, setQuery] = useState('');
  const [activePill, setActivePill] = useState('all');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Results & Pagination State
  const [caregivers, setCaregivers] = useState<CaregiverListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Active filter count (excluding defaults)
  const activeFilterCount =
    (filters.sortBy !== 'newest' ? 1 : 0) +
    (filters.role && filters.role !== 'All' ? 1 : 0) +
    (filters.city ? 1 : 0) +
    (filters.dementiaExperience ? 1 : 0) +
    (filters.minExperienceYears ? 1 : 0) +
    (filters.maxHourlyRate ? 1 : 0) +
    filters.capabilities.length +
    filters.specializations.length +
    filters.languages.length +
    filters.availability.length +
    (activePill !== 'all' ? 1 : 0);

  // Build effective filter payload combining modal filters & quick pill
  const getEffectiveOptions = useCallback(
    (pageNum: number) => {
      let role = filters.role;
      let dementiaExperience = filters.dementiaExperience;
      let availability = [...filters.availability];
      let sortBy = filters.sortBy;

      if (activePill === 'new') {
        sortBy = 'newest';
      } else if (activePill === 'dementia') {
        dementiaExperience = true;
      } else if (activePill === 'nurse') {
        role = 'Clinical Nurse';
      } else if (activePill === 'elder') {
        role = 'Geriatric Caregiver';
      } else if (activePill === 'day') {
        if (!availability.includes('Day Shifts')) availability.push('Day Shifts');
      } else if (activePill === 'overnight') {
        if (!availability.includes('Overnight')) availability.push('Overnight');
      }

      return {
        search: query.trim() || undefined,
        role: role && role !== 'All' ? role : undefined,
        city: filters.city || undefined,
        dementiaExperience: dementiaExperience || undefined,
        minExperienceYears: filters.minExperienceYears,
        maxHourlyRate: filters.maxHourlyRate,
        capabilities: filters.capabilities.length > 0 ? filters.capabilities : undefined,
        specializations: filters.specializations.length > 0 ? filters.specializations : undefined,
        languages: filters.languages.length > 0 ? filters.languages : undefined,
        availability: availability.length > 0 ? availability : undefined,
        sortBy,
        targetPatientId,
        page: pageNum,
        limit: 15,
      };
    },
    [query, activePill, filters, targetPatientId],
  );

  // Fetch list
  const loadCaregivers = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (pageNum === 1) {
        if (!isRefresh) setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        const options = getEffectiveOptions(pageNum);
        const result = await fetchCaregiversDiscovery(options);

        if (pageNum === 1) {
          setCaregivers(result.caregivers);
        } else {
          setCaregivers((prev) => [...prev, ...result.caregivers]);
        }

        setPage(result.pagination.page);
        setHasMore(result.pagination.hasMore);
        setTotalCount(result.pagination.total);
      } catch (err: any) {
        console.warn('[CareDiscoveryScreen] load error:', err);
        const errMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Unable to load caregivers. Please check your connection.';
        setError(errMsg);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [getEffectiveOptions],
  );

  // Debounced search / filter change trigger
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      void loadCaregivers(1);
    }, 280);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [loadCaregivers]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadCaregivers(1, true);
  };

  const handleEndReached = () => {
    if (!loading && !loadingMore && hasMore) {
      void loadCaregivers(page + 1);
    }
  };

  const handleSelectCaregiver = (caregiver: CaregiverListing) => {
    navigation.navigate('CaregiverProfileScreen', {
      caregiver,
      caregiverId: caregiver.id,
      targetPatientId,
      targetPatientName,
    });
  };

  const handlePillPress = (key: string) => {
    setActivePill((prev) => (prev === key ? 'all' : key));
  };

  const handleResetAll = () => {
    setQuery('');
    setActivePill('all');
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <ScreenContainer edges={['top', 'bottom', 'left', 'right']} style={styles.screen}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Find Care</Text>
          {targetPatientName ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              For {targetPatientName}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => setFilterModalVisible(true)}
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          hitSlop={10}
        >
          <Feather
            name="sliders"
            size={18}
            color={activeFilterCount > 0 ? '#FFFFFF' : C.textPrimary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Target Patient Matching Context Banner (Family or Patient view) */}
      {targetPatientName && (
        <View style={styles.matchingBanner}>
          <View style={styles.bannerIconWrap}>
            <Ionicons name="heart-circle" size={24} color={C.primary} />
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>
              Finding care for <Text style={{ fontFamily: F.bold }}>{targetPatientName}</Text>
            </Text>
            <Text style={styles.bannerSub}>
              Showing available caregivers matching care requirements
            </Text>
          </View>
        </View>
      )}

      {/* Search Input Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchInputWrap}>
          <Feather name="search" size={18} color={C.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, role, skills, city..."
            placeholderTextColor={C.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={C.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Quick Category Filter Pills (Astro Inspired) */}
      <View style={styles.pillsContainer}>
        <FlatList
          horizontal
          data={QUICK_PILLS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
          renderItem={({ item }) => {
            const isActive = activePill === item.key;
            return (
              <Pressable
                style={[
                  styles.pill,
                  isActive && styles.pillActive,
                ]}
                onPress={() => handlePillPress(item.key)}
              >
                <Text
                  style={[
                    styles.pillText,
                    isActive && styles.pillTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Total Results Summary */}
      {!loading && !error && (
        <View style={styles.resultsMetaRow}>
          <Text style={styles.resultsCountText}>
            {totalCount} {totalCount === 1 ? 'caregiver' : 'caregivers'} available
          </Text>
          {activeFilterCount > 0 && (
            <Pressable onPress={handleResetAll} hitSlop={8}>
              <Text style={styles.clearFiltersText}>Reset filters</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Results / Empty / Loading State */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loadingText}>Searching available caregivers...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
          <Text style={styles.errorTitle}>Unable to load caregivers</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => loadCaregivers(1)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : caregivers.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconWrap}>
            <Feather name="user-x" size={36} color={C.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No caregivers found</Text>
          <Text style={styles.emptySubtitle}>
            {query
              ? `No results matching "${query}". Try adjusting your search or filters.`
              : 'Try relaxing your filter criteria or broadening your service city.'}
          </Text>
          {activeFilterCount > 0 && (
            <Pressable style={styles.resetBtn} onPress={handleResetAll}>
              <Text style={styles.resetBtnText}>Clear All Filters</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={caregivers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CaregiverCard
              caregiver={item}
              onPress={handleSelectCaregiver}
              targetPatientName={targetPatientName}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={styles.footerLoaderText}>Loading more...</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Filter Modal */}
      <DiscoveryFilterModal
        visible={filterModalVisible}
        filters={filters}
        onClose={() => setFilterModalVisible(false)}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setPage(1);
        }}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setPage(1);
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.textPrimary,
  },
  headerSubtitle: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.primary,
    marginTop: 1,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: C.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontFamily: F.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  matchingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  bannerIconWrap: {
    marginRight: 10,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#065F46',
  },
  bannerSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  searchBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.regular,
    fontSize: 14,
    color: C.textPrimary,
  },
  clearBtn: {
    padding: 4,
  },
  pillsContainer: {
    paddingBottom: 8,
  },
  pillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  pillText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#475569',
  },
  pillTextActive: {
    fontFamily: F.bold,
    color: '#FFFFFF',
  },
  resultsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
    paddingTop: 4,
  },
  resultsCountText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textSecondary,
  },
  clearFiltersText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: C.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  loadingText: {
    fontFamily: F.medium,
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 14,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontFamily: F.bold,
    fontSize: 17,
    color: C.textPrimary,
  },
  emptySubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: 18,
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetBtnText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  errorTitle: {
    fontFamily: F.bold,
    fontSize: 16,
    color: '#EF4444',
    marginTop: 12,
  },
  errorSubtitle: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  retryBtnText: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.textPrimary,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoaderText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
  },
});
