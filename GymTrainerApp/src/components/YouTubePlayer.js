import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';

export default function YouTubePlayer({ videoId, title, thumbnail }) {
  const [playing, setPlaying] = useState(false);

  const thumbUrl = thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  if (Platform.OS === 'web' && playing) {
    return (
      <View style={s.container}>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={s.container}
      onPress={() => {
        if (Platform.OS === 'web') {
          setPlaying(true);
        } else {
          Linking.openURL(youtubeUrl);
        }
      }}
      activeOpacity={0.9}
    >
      {/* Thumbnail */}
      <View style={s.thumbContainer}>
        <View style={[s.thumb, { backgroundColor: C.surface2 }]}>
          {/* YouTube thumbnail image */}
          {Platform.OS === 'web' ? (
            <img
              src={thumbUrl}
              alt={title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <View style={s.thumbPlaceholder}>
              <Ionicons name="play-circle" size={48} color={C.brand} />
            </View>
          )}
        </View>

        {/* Play Button Overlay */}
        <View style={s.playOverlay}>
          <View style={s.playCircle}>
            <Ionicons name="logo-youtube" size={28} color="#FF0000" />
          </View>
        </View>

        {/* Duration badge */}
        <View style={s.durationBadge}>
          <Text style={s.durationText}>YouTube Tutorial</Text>
        </View>
      </View>

      {/* Title */}
      <View style={s.infoRow}>
        <View style={s.ytIcon}>
          <Ionicons name="logo-youtube" size={14} color="#FF0000" />
        </View>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <Ionicons name="open-outline" size={14} color={C.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { borderRadius: 18, overflow: 'hidden', backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  thumbContainer: { height: 200, position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1A1A24',
  },
  playOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#00000040',
  },
  playCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#FFFFFFF0', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10,
    elevation: 8,
  },
  durationBadge: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: '#000000CC', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  durationText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  ytIcon: {
    width: 26, height: 26, borderRadius: 6,
    backgroundColor: '#FF000015', justifyContent: 'center', alignItems: 'center',
  },
  title: { flex: 1, fontSize: 13, fontWeight: '600', color: C.textSub },
});

