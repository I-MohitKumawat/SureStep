import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { CaregiverListing } from './CaregiverSearchView';

interface Props {
  caregiver: CaregiverListing;
  linkStatus: string | null;
  targetPatientId?: string;
  targetPatientName?: string;
  onBack: () => void;
  onConfirm: (c: CaregiverListing) => void;
}

export const CaregiverDetailView: React.FC<Props> = ({
  caregiver,
  linkStatus,
  targetPatientName,
  onBack,
  onConfirm,
}) => {
  const yearsExp =
    caregiver.yearsOfExperience ??
    caregiver.years_experience ??
    0;

  const dementiaExp =
    caregiver.dementiaExperienceYears ??
    caregiver.dementia_experience_years ??
    0;

  const hasTraining = Boolean(
    caregiver.hasDementiaTraining ?? caregiver.has_dementia_training,
  );

  const rating = caregiver.rating;
  const ratingCount = caregiver.ratingCount ?? caregiver.rating_count ?? 0;
  const isUnrated = rating == null || ratingCount === 0;

  const photoUrl = caregiver.photoUrl || caregiver.profile_photo_url;
  const roleTitle =
    caregiver.professionalRole ||
    caregiver.professional_role ||
    caregiver.specialty ||
    'Caregiver';

  const bio = caregiver.fullBio || caregiver.bio || caregiver.about_me || '';

  // Pricing
  const hourlyRate = caregiver.hourlyRateInr ?? (caregiver.hourly_rate ? Number(caregiver.hourly_rate) : null);
  const dailyRate = caregiver.dailyRateInr ?? (caregiver.daily_rate ? Number(caregiver.daily_rate) : null);

  // Lists
  const capabilities = caregiver.careCapabilities || caregiver.care_capabilities || [];
  const specializations = caregiver.specializations || [];
  const languages = caregiver.languagesSpoken || caregiver.languages_spoken || [];
  const availability = caregiver.availabilityTypes || caregiver.availability_types || [];
  const qualifications = caregiver.qualifications || [];
  const city = caregiver.serviceCity || caregiver.service_city || caregiver.location;
  const radius = caregiver.serviceRadiusKm ?? caregiver.service_radius_km ?? 10;

  const isLinked =
    linkStatus === 'CONFIRMED' ||
    linkStatus === 'ACCEPTED' ||
    linkStatus === 'MEETING_COMPLETED' ||
    linkStatus === 'ACTIVE_CARE';

  const isPending = linkStatus === 'PENDING' || linkStatus === 'REQUESTED';

  const ctaLabel = targetPatientName
    ? `Request Care for ${targetPatientName}`
    : 'Request Care';

  return (
    <View style={styles.root}>
      {/* Top Header with Back, Title, and Persistent SOS */}
      <View style={styles.headerNav}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={14} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={C.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Caregiver</Text>
        <View style={styles.sosPill}>
          <Ionicons name="call" size={14} color="#DC2626" style={{ marginRight: 4 }} />
          <Text style={styles.sosText}>SOS</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatarWrap}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.heroAvatar} />
            ) : (
              <View style={styles.heroAvatarFallback}>
                <Feather name="user" size={44} color={C.textMuted} />
              </View>
            )}
          </View>

          <Text style={styles.heroName}>{caregiver.name}</Text>
          <Text style={styles.heroRole}>{roleTitle}</Text>
          {city ? (
            <View style={styles.heroLocationRow}>
              <Ionicons name="location-outline" size={14} color={C.primary} style={{ marginRight: 4 }} />
              <Text style={styles.heroLocationText}>{city}</Text>
            </View>
          ) : null}

          {/* Experience Highlights */}
          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Feather name="clock" size={15} color={C.primary} style={{ marginRight: 6 }} />
              <Text style={styles.heroStatText}>
                {yearsExp} {yearsExp === 1 ? 'Year' : 'Years'} Total Exp
              </Text>
            </View>
            {dementiaExp > 0 && (
              <View style={styles.heroStatItem}>
                <MaterialCommunityIcons name="brain" size={16} color={C.primary} style={{ marginRight: 6 }} />
                <Text style={styles.heroStatText}>
                  {dementiaExp} {dementiaExp === 1 ? 'Year' : 'Years'} Dementia
                </Text>
              </View>
            )}
          </View>

          {/* Languages */}
          {languages.length > 0 && (
            <View style={styles.heroLangRow}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={C.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.heroLangText}>
                Speaks: <Text style={{ fontFamily: F.semiBold }}>{languages.join(', ')}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Pricing & Service Ribbon */}
        <View style={styles.pricingRibbon}>
          <View style={styles.pricingCard}>
            <Text style={styles.pricingLabel}>HOURLY RATE</Text>
            <Text style={styles.pricingValue}>
              {hourlyRate != null && hourlyRate > 0 ? `₹${Math.round(hourlyRate)}` : 'Flexible'}
            </Text>
            <Text style={styles.pricingSub}>per hour</Text>
          </View>

          <View style={styles.pricingDivider} />

          <View style={styles.pricingCard}>
            <Text style={styles.pricingLabel}>DAILY RATE</Text>
            <Text style={styles.pricingValue}>
              {dailyRate != null && dailyRate > 0 ? `₹${Math.round(dailyRate)}` : 'Flexible'}
            </Text>
            <Text style={styles.pricingSub}>per 8-12 hr shift</Text>
          </View>

          <View style={styles.pricingDivider} />

          <View style={styles.pricingCard}>
            <Text style={styles.pricingLabel}>SERVICE AREA</Text>
            <Text style={styles.pricingValue} numberOfLines={1}>
              {city || 'Local Area'}
            </Text>
            <Text style={styles.pricingSub}>{radius} km radius</Text>
          </View>
        </View>

        {/* Care Capabilities Section */}
        {capabilities.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="hand-heart" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Care Capabilities</Text>
            </View>
            <View style={styles.capabilitiesList}>
              {capabilities.map((cap, idx) => (
                <View key={`cap-${idx}`} style={styles.capabilityItem}>
                  <View style={styles.capabilityDot} />
                  <Text style={styles.capabilityText}>{cap}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Condition Specializations Section */}
        {specializations.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="medical-bag" size={20} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Condition Specializations</Text>
            </View>
            <View style={styles.tagsWrap}>
              {specializations.map((spec, idx) => (
                <View key={`spec-${idx}`} style={styles.specChip}>
                  <Text style={styles.specChipText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* About Me & Care Philosophy */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Feather name="info" size={18} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>About Me & Care Philosophy</Text>
          </View>
          <Text style={styles.bioText}>
            {bio ? bio : 'No personalized care statement provided by this caregiver.'}
          </Text>
        </View>

        {/* Qualifications & Training */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Feather name="book-open" size={18} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Qualifications & Training</Text>
          </View>

          {hasTraining && (
            <View style={styles.qualificationItem}>
              <View style={styles.qualIconWrap}>
                <Feather name="book-open" size={16} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.qualName}>Dementia Care Training</Text>
                <Text style={styles.qualIssuer}>Reported by caregiver</Text>
              </View>
            </View>
          )}

          {qualifications.length > 0 ? (
            qualifications.map((qual, idx) => {
              const name = typeof qual === 'string' ? qual : qual.name;
              const issuer = typeof qual === 'object' ? qual.issuer : null;
              const year = typeof qual === 'object' ? qual.year : null;

              return (
                <View key={`qual-${idx}`} style={styles.qualificationItem}>
                  <View style={styles.qualIconWrap}>
                    <Feather name="book-open" size={16} color={C.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qualName}>{name}</Text>
                    {(issuer || year) && (
                      <Text style={styles.qualIssuer}>
                        {[issuer, year].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          ) : !hasTraining ? (
            <Text style={styles.emptyNote}>
              No formal certificates or credentials listed.
            </Text>
          ) : null}
        </View>

        {/* Working Shifts & Availability */}
        {availability.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Feather name="calendar" size={18} color={C.primary} style={{ marginRight: 8 }} />
              <Text style={styles.sectionTitle}>Accepted Shift Schedules</Text>
            </View>
            <View style={styles.tagsWrap}>
              {availability.map((shift, idx) => (
                <View key={`shift-${idx}`} style={styles.shiftBadge}>
                  <Feather name="clock" size={13} color="#0E7A67" style={{ marginRight: 6 }} />
                  <Text style={styles.shiftBadgeText}>{shift}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Operating Coverage Area */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Feather name="map-pin" size={18} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Operating Area & Travel Radius</Text>
          </View>
          <Text style={styles.areaText}>
            Serving patients across{' '}
            <Text style={{ fontFamily: F.bold, color: C.textPrimary }}>
              {city || 'designated operational sectors'}
            </Text>{' '}
            within a{' '}
            <Text style={{ fontFamily: F.bold, color: C.textPrimary }}>{radius} km</Text> travel
            radius.
          </Text>
        </View>

        {/* Reviews Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Feather name="message-square" size={18} color={C.primary} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>Patient & Family Reviews</Text>
          </View>
          {isUnrated ? (
            <View style={styles.reviewsEmpty}>
              <Ionicons name="chatbox-ellipses-outline" size={32} color={C.textMuted} />
              <Text style={styles.reviewsEmptyTitle}>No reviews yet</Text>
              <Text style={styles.reviewsEmptySub}>
                Reviews will appear here after completed care arrangements.
              </Text>
            </View>
          ) : (
            <View style={styles.reviewsSummary}>
              <Text style={styles.reviewsBigScore}>{rating.toFixed(1)}</Text>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.reviewsCountText}>
                  Based on {ratingCount} {ratingCount === 1 ? 'review' : 'reviews'}
                </Text>
                <Text style={styles.reviewsHonestSub}>
                  Feedback from care circle members
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Spacer for bottom floating bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating CTA Bottom Bar */}
      <View style={styles.floatingBar}>
        <View style={styles.privacyReassurance}>
          <Feather name="lock" size={12} color="#059669" style={{ marginRight: 4 }} />
          <Text style={styles.privacyText}>
            Contact details revealed upon mutual care confirmation
          </Text>
        </View>

        {isLinked ? (
          <View style={styles.activeLinkedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#065F46" style={{ marginRight: 6 }} />
            <Text style={styles.activeLinkedText}>Currently in your Care Team</Text>
          </View>
        ) : isPending ? (
          <View style={styles.pendingBanner}>
            <Ionicons name="time-outline" size={18} color="#92400E" style={{ marginRight: 6 }} />
            <Text style={styles.pendingText}>Care Request Pending Confirmation</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
            onPress={() => onConfirm(caregiver)}
          >
            <Text style={styles.ctaBtnText}>{ctaLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerNav: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: F.medium,
    fontSize: 15,
    color: C.textPrimary,
  },
  headerTitle: {
    fontFamily: F.bold,
    fontSize: 18,
    color: C.textPrimary,
  },
  sosPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE8E7',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  sosText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#DC2626',
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  heroLocationText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.primary,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  heroAvatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  heroAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  heroAvatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroName: {
    fontFamily: F.bold,
    fontSize: 20,
    color: C.textPrimary,
    textAlign: 'center',
  },
  heroRole: {
    fontFamily: F.semiBold,
    fontSize: 14,
    color: C.primary,
    marginTop: 3,
    textAlign: 'center',
  },
  heroRatingWrap: {
    marginTop: 10,
  },
  heroRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heroRatingScore: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#92400E',
    marginRight: 4,
  },
  heroRatingReviews: {
    fontFamily: F.regular,
    fontSize: 12,
    color: '#B45309',
  },
  heroNewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heroNewBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: '#475569',
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 12,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  heroStatText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#334155',
  },
  heroLangRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  heroLangText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: C.textSecondary,
  },
  pricingRibbon: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    alignItems: 'center',
  },
  pricingCard: {
    flex: 1,
    alignItems: 'center',
  },
  pricingDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  pricingLabel: {
    fontFamily: F.bold,
    fontSize: 10,
    color: C.textSecondary,
    letterSpacing: 0.6,
  },
  pricingValue: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
    marginTop: 3,
  },
  pricingSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textMuted,
    marginTop: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: F.bold,
    fontSize: 15,
    color: C.textPrimary,
  },
  capabilitiesList: {
    gap: 8,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  capabilityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
    marginRight: 10,
  },
  capabilityText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specChip: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  specChipText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#1D4ED8',
  },
  bioText: {
    fontFamily: F.regular,
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  qualificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 8,
  },
  qualIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  qualName: {
    fontFamily: F.semiBold,
    fontSize: 13,
    color: C.textPrimary,
  },
  qualIssuer: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 2,
  },
  emptyNote: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    fontStyle: 'italic',
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  shiftBadgeText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#0E7A67',
  },
  areaText: {
    fontFamily: F.regular,
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  reviewsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  reviewsEmptyTitle: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.textPrimary,
    marginTop: 8,
  },
  reviewsEmptySub: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  reviewsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 14,
    borderRadius: 12,
  },
  reviewsBigScore: {
    fontFamily: F.bold,
    fontSize: 28,
    color: '#92400E',
  },
  reviewsCountText: {
    fontFamily: F.bold,
    fontSize: 13,
    color: '#92400E',
  },
  reviewsHonestSub: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
  },
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  privacyReassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  privacyText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#059669',
  },
  ctaBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnPressed: {
    backgroundColor: C.primaryDark,
  },
  ctaBtnText: {
    fontFamily: F.bold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  activeLinkedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingVertical: 12,
    borderRadius: 14,
  },
  activeLinkedText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#065F46',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    borderRadius: 14,
  },
  pendingText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: '#92400E',
  },
});
