import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ms } from 'react-native-size-matters';
import { AVATARS, avatarSource } from '../lib/static';
import { color, font, shadow, space, text } from '../theme';
import { BottomSheetModal } from './BottomSheetModal';
import { Button } from './Button';
import { PixelIcon } from './PixelIcon';

export interface AvatarPickerModalProps {
  currentAvatar: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

const PAGE_SIZE = 6;
const TOTAL_PAGES = Math.ceil(AVATARS.length / PAGE_SIZE);

// Ported from packages/ui/src/components/AvatarPickerModal.tsx. Mount to open, unmount in onClose.
export function AvatarPickerModal({ currentAvatar, onSelect, onClose }: AvatarPickerModalProps) {
  const [selected, setSelected] = useState(currentAvatar);
  const [page, setPage] = useState(() => Math.max(0, Math.floor(AVATARS.indexOf(currentAvatar) / PAGE_SIZE)));
  const pageAvatars = AVATARS.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <BottomSheetModal onClose={onClose}>
      {(close) => (
        <>
          <Text style={styles.title} accessibilityRole="header">
            Select Avatar
          </Text>

          {/* Fixed 2 rows of 3 so the sheet height never changes between pages. */}
          <View style={styles.grid}>
            {Array.from({ length: PAGE_SIZE }, (_, i) => {
              const avatar = pageAvatars[i];
              if (!avatar) return <View key={`empty-${i}`} style={styles.tile} />;
              const isSelected = avatar === selected;
              return (
                <Pressable
                  key={avatar}
                  accessibilityRole="button"
                  accessibilityLabel={`Avatar ${AVATARS.indexOf(avatar) + 1}`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setSelected(avatar)}
                  style={[styles.tile, styles.option, isSelected ? styles.selected : styles.unselected]}
                >
                  <Image source={avatarSource(avatar)} style={styles.image} accessibilityIgnoresInvertColors />
                </Pressable>
              );
            })}
          </View>

          <View style={styles.pager}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous page"
              hitSlop={8}
              disabled={page === 0}
              onPress={() => setPage(page - 1)}
              style={[styles.pageButton, page === 0 && styles.disabled]}
            >
              <PixelIcon name="ChevronLeft" size={ms(20)} />
            </Pressable>
            <View style={styles.dots}>
              {Array.from({ length: TOTAL_PAGES }, (_, i) => (
                <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Page ${i + 1}`} hitSlop={10} onPress={() => setPage(i)} style={[styles.dot, i === page && styles.dotActive]} />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next page"
              hitSlop={8}
              disabled={page === TOTAL_PAGES - 1}
              onPress={() => setPage(page + 1)}
              style={[styles.pageButton, page === TOTAL_PAGES - 1 && styles.disabled]}
            >
              <PixelIcon name="ChevronRight" size={ms(20)} />
            </Pressable>
          </View>

          <Button
            label="Select Avatar"
            size="lg"
            onPress={() => {
              onSelect(selected);
              close();
            }}
          />
        </>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.heading, fontSize: ms(text.headlineMd.fontSize), color: color.primary, textTransform: 'uppercase' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: ms(space[4]), paddingVertical: ms(space[2]) },
  tile: { width: '30%', aspectRatio: 1 },
  option: { borderWidth: ms(4), overflow: 'hidden' },
  selected: { borderColor: color.primary, boxShadow: shadow.coin, transform: [{ scale: 1.05 }] },
  unselected: { borderColor: color.border, opacity: 0.7 },
  image: { width: '100%', height: '100%' },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageButton: { width: ms(36), height: ms(36), alignItems: 'center', justifyContent: 'center', borderWidth: ms(4), borderColor: color.border },
  disabled: { opacity: 0.3 },
  dots: { flexDirection: 'row', gap: ms(space[2]) },
  dot: { width: ms(12), height: ms(12), borderWidth: ms(2), borderColor: color.border, backgroundColor: color.surfaceHighest },
  dotActive: { backgroundColor: color.primary },
});
