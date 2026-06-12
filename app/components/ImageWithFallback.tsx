import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface ImageWithFallbackProps {
  source: any;
  style: any;
  fallbackText: string;
}

export default function ImageWithFallback({ source, style, fallbackText }: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  // Reset error state if the source URI changes
  const sourceUri = source && typeof source === 'object' ? source.uri : null;
  useEffect(() => {
    setError(false);
  }, [sourceUri]);

  const hasUri = source && typeof source === 'object' && source.uri;
  
  if (error || !source || (hasUri && !source.uri)) {
    const text = fallbackText || '?';
    const charCodeSum = text.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colors = ['#3A8AFF', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#3B82F6', '#EF4444'];
    const color = colors[charCodeSum % colors.length];
    
    const flatStyle = StyleSheet.flatten(style) || {};
    const width = flatStyle.width || 34;
    const height = flatStyle.height || 34;
    const borderRadius = flatStyle.borderRadius || 17;
    const marginRight = flatStyle.marginRight || 0;
    const marginLeft = flatStyle.marginLeft || 0;
    const marginTop = flatStyle.marginTop || 0;
    const marginBottom = flatStyle.marginBottom || 0;

    return (
      <View style={{
        width,
        height,
        borderRadius,
        marginRight,
        marginLeft,
        marginTop,
        marginBottom,
        backgroundColor: `${color}15`,
        borderWidth: 1,
        borderColor: `${color}30`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ color, fontSize: width > 24 ? 12 : 8, fontWeight: '800' }}>
          {text.substring(0, 2).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      onError={() => setError(true)}
    />
  );
}
