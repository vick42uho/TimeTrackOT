import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight'; // Make sure this path is correct
import { useColor } from '@/hooks/useColor';
import { BORDER_RADIUS } from '@/theme/globals';
import React, { useEffect } from 'react';
import {
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type BottomSheetContentProps = {
  children: React.ReactNode;
  title?: string;
  footer?: React.ReactNode;
  style?: ViewStyle;
  rBottomSheetStyle: any;
  cardColor: string;
  mutedColor: string;
  maxSheetHeight: number;
  onHandlePress?: () => void;
  gesture?: any;
};

// Component for the bottom sheet content
const BottomSheetContent = ({
  children,
  title,
  footer,
  style,
  rBottomSheetStyle,
  cardColor,
  mutedColor,
  maxSheetHeight,
  onHandlePress,
  gesture,
}: BottomSheetContentProps) => {
  const insets = useSafeAreaInsets();

  const headerContent = (
    <View style={{ width: '100%' }}>
      {/* Handle */}
      <TouchableWithoutFeedback onPress={onHandlePress}>
        <View
          style={{
            width: '100%',
            paddingTop: 10,
            paddingBottom: 6,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 50,
              height: 5,
              backgroundColor: mutedColor,
              borderRadius: 999,
            }}
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Title */}
      {title && (
        <View
          style={{
            marginHorizontal: 16,
            paddingBottom: 8,
          }}
        >
          <Text variant='title' style={{ textAlign: 'center', fontSize: 16, fontWeight: '700' }}>
            {title}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Animated.View
      style={[
        {
          height: maxSheetHeight,
          width: '100%',
          position: 'absolute',
          bottom: 0,
          backgroundColor: cardColor,
          borderTopLeftRadius: BORDER_RADIUS,
          borderTopRightRadius: BORDER_RADIUS,
          overflow: 'hidden',
        },
        rBottomSheetStyle,
        style,
      ]}
    >
      {/* Drag Handle & Header - GestureDetector is attached here so inner form can scroll freely */}
      {gesture ? (
        <GestureDetector gesture={gesture}>
          {headerContent}
        </GestureDetector>
      ) : (
        headerContent
      )}

      {/* Content wrapped in a clean, unobstructed ScrollView */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: footer ? 12 : Math.max(insets.bottom + 48, 64),
        }}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {children}
      </ScrollView>

      {/* Pinned Bottom Footer (e.g. Save/Cancel action buttons) */}
      {footer && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom + 8, 16),
            borderTopWidth: 1,
            borderTopColor: 'rgba(150, 150, 150, 0.15)',
            backgroundColor: cardColor,
          }}
        >
          {footer}
        </View>
      )}
    </Animated.View>
  );
};

type BottomSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  enableBackdropDismiss?: boolean;
  title?: string;
  footer?: React.ReactNode;
  style?: ViewStyle;
  disablePanGesture?: boolean;
};

export function BottomSheet({
  isVisible,
  onClose,
  children,
  snapPoints = [0.92],
  enableBackdropDismiss = true,
  title,
  footer,
  style,
  disablePanGesture = false,
}: BottomSheetProps) {
  const cardColor = useColor('card');
  const mutedColor = useColor('muted');
  const { keyboardHeight, isKeyboardVisible } = useKeyboardHeight();
  const { height: screenHeight } = useWindowDimensions();

  // Normalize snap points
  const points = snapPoints && snapPoints.length > 0 ? snapPoints : [0.92];
  const maxPoint = Math.max(...points);
  const maxSheetHeight = Math.round(screenHeight * maxPoint);

  // Snap offsets from bottom (0 means fully open at maxSheetHeight)
  const snapOffsets = points.map((p) => Math.round(maxSheetHeight - screenHeight * p));
  // Default to 0 (fully expanded to max height) so the sheet springs all the way up
  const defaultOffset = 0;

  const translateY = useSharedValue(maxSheetHeight + 50);
  const context = useSharedValue({ y: 0 });
  const opacity = useSharedValue(0);
  const currentSnapIndex = useSharedValue(0);
  const keyboardHeightSV = useSharedValue(0);

  const [modalVisible, setModalVisible] = React.useState(false);

  // Effect to handle opening and closing the bottom sheet
  useEffect(() => {
    if (isVisible) {
      setModalVisible(true);
      translateY.value = withSpring(defaultOffset, {
        damping: 45,
        stiffness: 380,
      });
      opacity.value = withTiming(1, { duration: 250 });
      currentSnapIndex.value = 0;
    } else {
      translateY.value = withSpring(maxSheetHeight + 50, { damping: 45, stiffness: 380 });
      opacity.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) {
          runOnJS(setModalVisible)(false);
        }
      });
    }
  }, [isVisible, defaultOffset, maxSheetHeight]);

  const scrollTo = (destination: number) => {
    'worklet';
    translateY.value = withSpring(destination, { damping: 45, stiffness: 380 });
  };

  // Keyboard adjustment
  useEffect(() => {
    keyboardHeightSV.value = keyboardHeight;
    if (isVisible) {
      const currentOffset = snapOffsets[currentSnapIndex.value] || 0;
      if (isKeyboardVisible && keyboardHeight > 0) {
        scrollTo(Math.max(-maxSheetHeight * 0.1, currentOffset - keyboardHeight * 0.6));
      } else {
        scrollTo(currentOffset);
      }
    }
  }, [keyboardHeight, isKeyboardVisible, isVisible]);

  const animateClose = () => {
    'worklet';
    translateY.value = withSpring(maxSheetHeight + 50, { damping: 45, stiffness: 380 });
    opacity.value = withTiming(0, { duration: 250 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      const newY = context.value.y + event.translationY;
      if (newY >= -20) {
        translateY.value = newY;
      }
    })
    .onEnd((event) => {
      const currentY = translateY.value;
      const velocity = event.velocityY;

      if (velocity > 600 || currentY > maxSheetHeight * 0.35) {
        animateClose();
      } else {
        let closest = snapOffsets[0];
        let minDiff = Math.abs(currentY - closest);
        let closestIdx = 0;
        for (let i = 0; i < snapOffsets.length; i++) {
          const diff = Math.abs(currentY - snapOffsets[i]);
          if (diff < minDiff) {
            minDiff = diff;
            closest = snapOffsets[i];
            closestIdx = i;
          }
        }
        currentSnapIndex.value = closestIdx;
        scrollTo(closest);
      }
    });

  const rBottomSheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const rBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handleBackdropPress = () => {
    if (enableBackdropDismiss) {
      animateClose();
    }
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      statusBarTranslucent
      animationType='none'
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[
            { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)' },
            rBackdropStyle,
          ]}
          accessibilityViewIsModal
        >
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <Animated.View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>

          <BottomSheetContent
            children={children}
            title={title}
            footer={footer}
            style={style}
            rBottomSheetStyle={rBottomSheetStyle}
            cardColor={cardColor}
            mutedColor={mutedColor}
            maxSheetHeight={maxSheetHeight}
            onHandlePress={() => {}}
            gesture={disablePanGesture ? undefined : gesture}
          />
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// Hook for managing bottom sheet state
export function useBottomSheet() {
  const [isVisible, setIsVisible] = React.useState(false);

  const open = React.useCallback(() => {
    setIsVisible(true);
  }, []);

  const close = React.useCallback(() => {
    setIsVisible(false);
  }, []);

  const toggle = React.useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  return {
    isVisible,
    open,
    close,
    toggle,
  };
}
