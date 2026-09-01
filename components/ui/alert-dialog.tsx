import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useColor } from '@/hooks/useColor';
import React, { useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type AlertDialogProps = {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive' | 'secondary' | 'outline';
  cancelVariant?: 'default' | 'destructive' | 'secondary' | 'outline';
  buttonLayout?: 'row' | 'column';
  onConfirm?: () => void;
  onCancel?: () => void;
  dismissible?: boolean;
  showCancelButton?: boolean;
  style?: ViewStyle;
};

// A simple card-like dialog overlay with fade-in animation similar to BottomSheet's backdrop
export function AlertDialog({
  isVisible,
  onClose,
  title,
  description,
  children,
  confirmText = 'ตกลง',
  cancelText = 'ยกเลิก',
  confirmVariant = 'default',
  cancelVariant = 'outline',
  buttonLayout = 'row',
  onConfirm,
  onCancel,
  dismissible = true,
  showCancelButton = true,
  style,
}: AlertDialogProps) {
  const cardColor = useColor('card');

  const [modalVisible, setModalVisible] = React.useState(false);
  const backdropOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      setModalVisible(true);
      backdropOpacity.value = withTiming(1, { duration: 250 });
      cardOpacity.value = withTiming(1, { duration: 200 });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) {
          runOnJS(setModalVisible)(false);
        }
      });
      cardOpacity.value = withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const rBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const rCardFadeStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
  }));

  const animateClose = () => {
    'worklet';
    backdropOpacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
    cardOpacity.value = withTiming(0, { duration: 200 });
  };

  const handleBackdropPress = () => {
    if (dismissible) {
      animateClose();
      if (onCancel) onCancel();
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    animateClose();
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    animateClose();
  };

  return (
    <Modal
      visible={modalVisible}
      transparent
      statusBarTranslucent
      animationType='none'
    >
      <Animated.View
        style={[styles.backdrop, rBackdropStyle]}
        accessibilityViewIsModal
      >
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View style={styles.backdropTouchableArea} />
        </TouchableWithoutFeedback>

        {/* Non-animated outer wrapper: handles rounded corners and clipping */}
        <View
          style={[styles.roundedWrapper, { backgroundColor: cardColor }, style]}
        >
          {/* Only fade the inner content */}
          <Animated.View style={[styles.innerContent, rCardFadeStyle]}>
            <Card
              // Card has no rounded corners, background or shadow (delegated to wrapper)
              style={{ backgroundColor: 'transparent', elevation: 0, padding: 20 }}
            >
              {(title || description) && (
                <CardHeader style={{ marginBottom: 4 }}>
                  {title ? (
                    <CardTitle accessibilityRole='alert' style={{ fontSize: 18, marginBottom: 8 }}>
                      {title}
                    </CardTitle>
                  ) : null}
                  {description ? (
                    <CardDescription
                      accessibilityRole='alert'
                      style={{ fontSize: 14, lineHeight: 22 }}
                    >
                      {description}
                    </CardDescription>
                  ) : null}
                </CardHeader>
              )}
              {children ? <CardContent style={{ paddingHorizontal: 0 }}>{children}</CardContent> : null}
              <CardFooter
                style={{
                  marginTop: 18,
                  gap: 10,
                  paddingHorizontal: 0,
                  flexDirection: buttonLayout === 'column' ? 'column' : 'row',
                }}
              >
                {showCancelButton && (
                  <Button
                    variant={cancelVariant}
                    size="sm"
                    style={buttonLayout === 'row' ? { flex: 1, minHeight: 46 } : { width: '100%', minHeight: 46 }}
                    textStyle={{ fontSize: 14, fontFamily: 'Sarabun_700Bold' }}
                    onPress={handleCancel}
                  >
                    {cancelText}
                  </Button>
                )}
                <Button
                  variant={confirmVariant}
                  size="sm"
                  style={buttonLayout === 'row' ? { flex: 1, minHeight: 46 } : { width: '100%', minHeight: 46 }}
                  textStyle={{ fontSize: 14, fontFamily: 'Sarabun_700Bold' }}
                  onPress={handleConfirm}
                >
                  {confirmText}
                </Button>
              </CardFooter>
            </Card>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backdropTouchableArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Rounded corners and clipping consolidated here (non-animated)
  roundedWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  // Inner content can render freely (only opacity is animated)
  innerContent: {
    width: '100%',
  },
});

export function useAlertDialog() {
  const [isVisible, setIsVisible] = React.useState(false);
  const open = React.useCallback(() => setIsVisible(true), []);
  const close = React.useCallback(() => setIsVisible(false), []);
  const toggle = React.useCallback(() => setIsVisible((v) => !v), []);
  return { isVisible, open, close, toggle };
}
