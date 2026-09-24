import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { C } from '../../theme/colors';
import { F } from '../../theme/fonts';
import type { CaregiverListing } from '../../screens/patient/CaregiverSearchView';

interface Props {
  caregiver: CaregiverListing;
  onPress: (caregiver: CaregiverListing) => void;
  targetPatientName?: string;
}

export const CaregiverCard: React.FC<Props> = ({
  caregiver,
  onPress,
}) => {
  const yearsExp =
    caregiver.yearsOfExperience ??
    caregiver.years_experience ??
    0;

  const dementiaExp =
    caregiver.dementiaExperienceYears ??
    caregiver.dementia_experience_years ??
    0;

  const rating = caregiver.rating;
  const ratingCount = caregiver.ratingCount ?? caregiver.rating_count ?? 0;
  const isUnrated = rating == null || ratingCount === 0;

  // Rate formatting
  const rateText =
    caregiver.hourlyRateInr != null && caregiver.hourlyRateInr > 0
      ? `₹${Math.round(caregiver.hourlyRateInr)}/hr`
      : caregiver.dailyRateInr != null && caregiver.dailyRateInr > 0
      ? `₹${Math.round(caregiver.dailyRateInr)}/day`
      : caregiver.fee && caregiver.fee !== 'Contact for rates'
      ? caregiver.fee
      : 'Contact for rates';

  // Photo
  const photoUrl = caregiver.photoUrl || caregiver.profile_photo_url;

  // Role title
  const roleTitle =
    caregiver.professionalRole ||
    caregiver.professional_role ||
    caregiver.specialty ||
    'Caregiver';

  // Languages summary
  const languages =
    caregiver.languagesSpoken || caregiver.languages_spoken || [];
  const languageSummary =
    languages.length > 0
      ? languages.slice(0, 3).join(', ') + (languages.length > 3 ? '...' : '')
      : null;

  // Tags: combine specializations + care capabilities (up to 4 tags)
  const specs = caregiver.specializations || [];
  const capabilities =
    caregiver.careCapabilities || caregiver.care_capabilities || [];
  const allTags = [...specs, ...capabilities].slice(0, 4);

  // Location / Radius
  const city = caregiver.serviceCity || caregiver.service_city || caregiver.location;
  const radius = caregiver.serviceRadiusKm ?? caregiver.service_radius_km ?? 10;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(caregiver)}
      accessibilityRole="button"
      accessibilityLabel={`View profile for ${caregiver.name}, ${roleTitle}`}
    >
      {/* Top Section: Avatar + Identity + Rating */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Feather name="user" size={28} color={C.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {caregiver.name}
            </Text>
          </View>

          <Text style={styles.roleText} numberOfLines={1}>
            {roleTitle}
          </Text>

          {languageSummary && (
            <View style={styles.langRow}>
              <Ionicons name="chatbubbles-outline" size={13} color={C.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.langText} numberOfLines={1}>
                {languageSummary}
              </Text>
            </View>
          )}
        </View>

        {/* Rating or New badge */}
        <View style={styles.ratingContainer}>
          {isUnrated ? (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>New</Text>
            </View>
          ) : (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color="#D97706" style={{ marginRight: 3 }} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <Text style={styles.ratingCountText}>({ratingCount})</Text>
            </View>
          )}
        </View>
      </View>

      {/* Experience & Training Highlights */}
      <View style={styles.expRow}>
        <View style={styles.expPill}>
          <Feather name="clock" size={13} color={C.primary} style={{ marginRight: 5 }} />
          <Text style={styles.expText}>
            Exp: {yearsExp} {yearsExp === 1 ? 'Yr' : 'Yrs'}
            {dementiaExp > 0 ? ` · ${dementiaExp} yrs Dementia` : ''}
          </Text>
        </View>
        {(caregiver.hasDementiaTraining || caregiver.has_dementia_training) && (
          <View style={styles.trainingPill}>
            <Feather name="book-open" size={12} color={C.primary} style={{ marginRight: 4 }} />
            <Text style={styles.trainingText}>Dementia Training</Text>
          </View>
        )}
      </View>

      {/* Tags: Capabilities & Conditions */}
      {allTags.length > 0 && (
        <View style={styles.tagsRow}>
          {allTags.map((tag, idx) => (
            <View key={`${tag}-${idx}`} style={styles.tag}>
              <Text style={styles.tagText} numberOfLines={1}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom Section: Location & Rate + View Profile CTA */}
      <View style={styles.bottomRow}>
        <View style={styles.metaCol}>
          {city ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={C.textSecondary} style={{ marginRight: 4 }} />
              <Text style={styles.locationText} numberOfLines={1}>
                {city} · {radius}km radius
              </Text>
            </View>
          ) : null}
          <Text style={styles.rateText}>{rateText}</Text>
        </View>

        <Pressable
          style={styles.profileBtn}
          onPress={() => onPress(caregiver)}
          hitSlop={8}
        >
          <Text style={styles.profileBtnText}>View Profile</Text>
          <Feather name="chevron-right" size={15} color={C.primary} style={{ marginLeft: 2 }} />
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
    borderColor: C.primaryLight,
    transform: [{ scale: 0.995 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  avatarFallback: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.textPrimary,
    lineHeight: 22,
  },
  roleText: {
    fontFamily: F.medium,
    fontSize: 13,
    color: C.primary,
    marginTop: 2,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  langText: {
    fontFamily: F.regular,
    fontSize: 12,
    color: C.textSecondary,
    flex: 1,
  },
  ratingContainer: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontFamily: F.bold,
    fontSize: 12,
    color: '#92400E',
  },
  ratingCountText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#B45309',
    marginLeft: 2,
  },
  newBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    fontFamily: F.semiBold,
    fontSize: 11,
    color: '#475569',
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  expPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  expText: {
    fontFamily: F.medium,
    fontSize: 12,
    color: '#334155',
  },
  trainingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  trainingText: {
    fontFamily: F.medium,
    fontSize: 11,
    color: '#334155',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 6,
  },
  tag: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaCol: {
    flex: 1,
    marginRight: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  locationText: {
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textSecondary,
  },
  rateText: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.textPrimary,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  profileBtnText: {
    fontFamily: F.semiBold,
    fontSize: 12,
    color: C.primary,
  },
});
