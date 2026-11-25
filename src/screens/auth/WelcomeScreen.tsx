import React from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { ScreenContainer } from '../../components/shared/ScreenContainer';
import type { AuthStackParams } from '../../types/navigation.types';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParams, 'WelcomeScreen'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { status, firebaseUser, logout } = useAuth();

  // Mid-onboarding: Firebase session exists but DB profile not yet created
  const isOnboarding = status === 'no_role' || status === 'no_profile';

  return (
    <ScreenContainer
      edges={['top', 'bottom', 'left', 'right']}
      style={{"flex":1,"backgroundColor":"transparent"}}
    >
      {(theme) => (
        <>
          <StatusBar barStyle="dark-content" />
          {/* SKY BACKGROUND */}
          <LinearGradient
            colors={['#57CFF2', '#BFEFFF', theme.colors.background]}
            locations={[0, 0.45, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{"position":"absolute","top":0,"left":0,"right":0,"height":250}}
          />

          {/* CONTENT */}
          <View className="flex-1 justify-between">
            {/* LOGO AREA */}
            <View className="items-center pt-[80px]">
              {/* PIN SHAPE */}
              <View className="items-center mb-[35px]">
                {/* Outer PIN */}
                <View className="w-[210px] h-[210px] rounded-[105px] bg-[#45C8EE] items-center justify-center" style={{"shadowColor":"#000","shadowOpacity":0.12,"shadowOffset":{"width":0,"height":14},"shadowRadius":24,"elevation":12}}>
                  {/* Inner Dark */}
                  <View className="w-[165px] h-[165px] rounded-[82.5px] bg-care-plum items-center justify-center">
                    {/* FACE */}
                    <View className="w-[96px] h-[96px] rounded-[48px] bg-white items-center justify-center">
                      <View className="flex-row gap-[18px] mb-[12px]">
                        <View className="w-[10px] h-[10px] rounded-[5px] bg-care-plum" />
                        <View className="w-[10px] h-[10px] rounded-[5px] bg-care-plum" />
                      </View>
                      <View className="w-[40px] h-[20px] border-[6px] border-t-[0px] border-care-plum rounded-bl-[24px] rounded-br-[24px]" />
                    </View>
                  </View>
                </View>
                {/* PIN DOT */}
                <View className="w-[28px] h-[28px] rounded-[14px] bg-[#45C8EE] mt-[10px]" style={{"shadowColor":"#000","shadowOpacity":0.1,"shadowOffset":{"width":0,"height":6},"shadowRadius":10,"elevation":5}} />
              </View>

              <Text className="font-inter-extrabold text-[28px] text-care-plum tracking-[9px]">SURESTEP</Text>
              <Text className="font-inter-medium text-[14px] text-care-plum text-center mt-[6px]">Your daily care companion</Text>
            </View>

            {/* BOTTOM SECTION */}
            <View className="relative px-[28px] pb-[36px] pt-[44px] items-center w-[100%]">
              {/* SLANTED SURFACE */}
              <View className="absolute top-[0px] left-[-30px] right-[-30px] bottom-[-80px] bg-brand-light rounded-tl-[60px] rounded-tr-[60px]" style={{"transform":[{"rotate":"-6deg"}]}} pointerEvents="none" />

              {isOnboarding ? (
                // Mid-onboarding: user is Firebase-authenticated but hasn't finished DB setup
                <View className="w-[100%] items-center z-[10]">
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => status === 'no_role'
                      ? navigation.navigate('RoleSelectionScreen')
                      : navigation.navigate('ProfileSetupScreen', { role: 'PATIENT' })
                    }
                    className="w-[100%] h-[58px] rounded-[29px] bg-brand items-center justify-center mb-[16px]" style={{"shadowColor":"#0A5D50","shadowOpacity":0.28,"shadowOffset":{"width":0,"height":6},"shadowRadius":12,"elevation":6}}
                  >
                    <Text className="font-inter-bold text-[18px] tracking-[1.2px] text-white">
                      Continue as{' '}
                      <Text className="font-inter-extrabold">{firebaseUser?.phoneNumber ?? 'your number'}</Text>
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => logout()} className="mt-[8px] py-[10px] px-[16px] z-[10]">
                    <Text className="font-inter-bold text-[14px] text-brand underline">Sign out / use a different number</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Unified Sign In entry point
                <View className="w-[100%] items-center z-[10]">
                  <TouchableOpacity
                    activeOpacity={0.88}
                    onPress={() => navigation.navigate('PhoneAuthScreen')}
                    className="w-[100%] h-[58px] rounded-[29px] bg-brand items-center justify-center mb-[16px]" style={{"shadowColor":"#0A5D50","shadowOpacity":0.28,"shadowOffset":{"width":0,"height":6},"shadowRadius":12,"elevation":6}}
                  >
                    <Text className="font-inter-bold text-[18px] tracking-[1.2px] text-white">Sign In with Phone</Text>
                  </TouchableOpacity>
                  <Text className="font-inter-medium text-[14px] text-[#084C41] text-center leading-[20px]">
                    New to SureStep? Sign in to set up your profile.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}
    </ScreenContainer>
  );
};
