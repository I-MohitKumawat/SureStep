import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';

const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

export interface AvatarProps {
  name: string;
  uri?: string | null;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  uri,
  size = 48,
}) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full bg-[#E1F2F4]"
      style={{
        width: size,
        height: size,
      }}
    >
      {uri && !failed ? (
        <Image
          source={{ uri }}
          onError={() => setFailed(true)}
          accessibilityLabel={`${name} profile photo`}
          style={{
            width: size,
            height: size,
          }}
        />
      ) : (
        <Text
          className="font-inter-semibold text-[#256C78]"
          style={{
            fontSize: size * 0.34,
          }}
        >
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
};
