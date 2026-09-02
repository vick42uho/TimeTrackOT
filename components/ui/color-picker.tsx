import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { BORDER_RADIUS, CORNERS, FONT_SIZE, HEIGHT } from '@/theme/globals';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const PICKER_SIZE = Math.min(screenWidth - 48, 320);
const HUE_BAR_HEIGHT = 40;
const KNOB_SIZE = 36;

// Color utility functions
const hsvToRgb = (h: number, s: number, v: number) => {
  'worklet';
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const hexToRgb = (hex: string) => {
  let normalized = hex.replace('#', '');
  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((c) => c + c)
      .join('');
  } else if (normalized.length === 8) {
    normalized = normalized.slice(0, 6);
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const isValidHex = (hex: string) =>
  /^#?([a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})$/i.test(hex);

const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s, v };
};

export interface ColorSwatchProps {
  color: string;
  size?: number;
  style?: ViewStyle;
  onPress?: () => void;
  accessibilityLabel?: string;
  isSelected?: boolean;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  size = 36,
  style,
  onPress,
  accessibilityLabel,
  isSelected = false,
}) => {
  const borderColor = useColor('border');
  const primaryColor = useColor('primary');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: isSelected ? 2.5 : 1.5,
          borderColor: isSelected ? primaryColor : borderColor,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      activeOpacity={onPress ? 0.8 : 1}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={accessibilityLabel ?? `Color swatch ${color}`}
    />
  );
};

export interface ColorPickerProps {
  value?: string;
  onColorChange?: (color: string) => void;
  onColorSelect?: (color: string) => void;
  swatchSize?: number;
  disabled?: boolean;
  style?: ViewStyle;
  title?: string;
  cancelText?: string;
  confirmText?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '#2563eb',
  onColorChange,
  onColorSelect,
  swatchSize = HEIGHT,
  disabled = false,
  style,
  title = 'เลือกสีการ์ด (Color Picker)',
  cancelText = 'ยกเลิก',
  confirmText = 'ตกลง',
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentColor, setCurrentColor] = useState(value);
  const [pureHueColor, setPureHueColor] = useState('#ff0000');
  const [hexInput, setHexInput] = useState(value);

  const card = useColor('card');
  const borderColor = useColor('border');
  const textColor = useColor('text');
  const primaryColor = useColor('primary');

  // Initialize HSV values from the current color
  const rgb = hexToRgb(currentColor);
  const initialHsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

  const hue = useSharedValue(initialHsv.h);
  const saturation = useSharedValue(initialHsv.s);
  const brightness = useSharedValue(initialHsv.v);

  const updateColor = useCallback(
    (h: number, s: number, v: number) => {
      const rgb = hsvToRgb(h, s, v);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setCurrentColor(hex);
      onColorChange?.(hex);

      const pureRgb = hsvToRgb(h, 1, 1);
      const pureHex = rgbToHex(pureRgb.r, pureRgb.g, pureRgb.b);
      setPureHueColor(pureHex);
    },
    [onColorChange]
  );

  useEffect(() => {
    setCurrentColor(value);
  }, [value]);

  useEffect(() => {
    if (isModalVisible) {
      const rgb = hexToRgb(currentColor);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      hue.value = hsv.h;
      saturation.value = hsv.s;
      brightness.value = hsv.v;

      const pureRgb = hsvToRgb(hsv.h, 1, 1);
      const pureHex = rgbToHex(pureRgb.r, pureRgb.g, pureRgb.b);
      setPureHueColor(pureHex);
      setHexInput(currentColor);
    }
  }, [isModalVisible, currentColor]);

  const hueGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      const newX = Math.max(
        0,
        Math.min(PICKER_SIZE - KNOB_SIZE, event.x - KNOB_SIZE / 2)
      );
      hue.value = (newX / (PICKER_SIZE - KNOB_SIZE)) * 360;
    })
    .onUpdate((event) => {
      const newX = Math.max(
        0,
        Math.min(PICKER_SIZE - KNOB_SIZE, event.x - KNOB_SIZE / 2)
      );
      hue.value = (newX / (PICKER_SIZE - KNOB_SIZE)) * 360;
    })
    .onEnd(() => {
      runOnJS(updateColor)(hue.value, saturation.value, brightness.value);
    });

  const pickerGesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((event) => {
      const newX = Math.max(
        0,
        Math.min(PICKER_SIZE - KNOB_SIZE, event.x - KNOB_SIZE / 2)
      );
      const newY = Math.max(
        0,
        Math.min(PICKER_SIZE - KNOB_SIZE, event.y - KNOB_SIZE / 2)
      );

      saturation.value = newX / (PICKER_SIZE - KNOB_SIZE);
      brightness.value = 1 - newY / (PICKER_SIZE - KNOB_SIZE);
    })
    .onUpdate((event) => {
      const newX = Math.max(
        0,
        Math.min(PICKER_SIZE - KNOB_SIZE, event.x - KNOB_SIZE / 2)
      );
      const newY = Math.max(
        0,
        Math.min(PICKER_SIZE - KNOB_SIZE, event.y - KNOB_SIZE / 2)
      );

      saturation.value = newX / (PICKER_SIZE - KNOB_SIZE);
      brightness.value = 1 - newY / (PICKER_SIZE - KNOB_SIZE);
    })
    .onEnd(() => {
      runOnJS(updateColor)(hue.value, saturation.value, brightness.value);
    });

  const hueKnobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (hue.value / 360) * (PICKER_SIZE - KNOB_SIZE) }],
  }));

  const pickerKnobStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: saturation.value * (PICKER_SIZE - KNOB_SIZE) },
      { translateY: (1 - brightness.value) * (PICKER_SIZE - KNOB_SIZE) },
    ],
  }));

  const pureHueAnimatedStyle = useAnimatedStyle(() => {
    const rgb = hsvToRgb(hue.value, 1, 1);
    return {
      backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    };
  });

  const previewAnimatedStyle = useAnimatedStyle(() => {
    const rgb = hsvToRgb(hue.value, saturation.value, brightness.value);
    return {
      backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    };
  });

  const handleHexSubmit = useCallback(() => {
    if (!isValidHex(hexInput)) {
      setHexInput(currentColor);
      return;
    }

    const normalized = hexInput.startsWith('#') ? hexInput : `#${hexInput}`;
    const rgb = hexToRgb(normalized);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    hue.value = hsv.h;
    saturation.value = hsv.s;
    brightness.value = hsv.v;
    updateColor(hsv.h, hsv.s, hsv.v);
  }, [hexInput, currentColor, updateColor]);

  const handleColorSelect = () => {
    const rgb = hsvToRgb(hue.value, saturation.value, brightness.value);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    onColorChange?.(hex);
    onColorSelect?.(hex);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setCurrentColor(value);
    setIsModalVisible(false);
  };

  return (
    <View style={style}>
      <ColorSwatch
        color={currentColor}
        size={swatchSize}
        onPress={disabled ? undefined : () => setIsModalVisible(true)}
        accessibilityLabel={`Selected color ${currentColor}. Opens color picker.`}
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: card }]} edges={['top', 'bottom']}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ color: textColor, fontSize: 15, fontFamily: 'Sarabun_500Medium' }}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
              <Text variant="subtitle" style={{ fontFamily: 'Sarabun_700Bold' }}>
                {title}
              </Text>
              <TouchableOpacity onPress={handleColorSelect} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ color: primaryColor, fontSize: 15, fontWeight: '700', fontFamily: 'Sarabun_700Bold' }}>
                  {confirmText}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.content}>
              {/* Color Preview */}
              <Animated.View
                style={[
                  {
                    height: 64,
                    width: '100%',
                    alignItems: 'center',
                    marginBottom: 16,
                    justifyContent: 'center',
                    borderRadius: BORDER_RADIUS,
                  },
                  previewAnimatedStyle,
                ]}
                accessibilityLabel={`Color preview: ${currentColor}`}
              >
                <Text
                  variant="caption"
                  style={{ color: '#ffffff', fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 3 }}
                >
                  {currentColor.toUpperCase()}
                </Text>
              </Animated.View>

              {/* Manual hex entry */}
              <TextInput
                value={hexInput}
                onChangeText={setHexInput}
                onSubmitEditing={handleHexSubmit}
                onBlur={handleHexSubmit}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={9}
                placeholder="#RRGGBB"
                placeholderTextColor={textColor}
                accessibilityLabel="Hex color code"
                accessibilityHint="Enter a hex color code, for example RRGGBB"
                style={{
                  width: '100%',
                  marginBottom: 20,
                  paddingHorizontal: 16,
                  height: 44,
                  borderRadius: CORNERS,
                  borderWidth: 1,
                  borderColor,
                  color: textColor,
                  fontSize: FONT_SIZE,
                  textAlign: 'center',
                  fontFamily: 'Sarabun_500Medium',
                }}
              />

              {/* Saturation/Brightness Picker */}
              <View style={styles.pickerContainer}>
                <GestureDetector gesture={pickerGesture}>
                  <View
                    style={{ width: PICKER_SIZE, height: PICKER_SIZE }}
                    collapsable={false}
                  >
                    {/* Base color layer */}
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.colorBase,
                        pureHueAnimatedStyle,
                      ]}
                    />

                    {/* Saturation gradient (white to transparent, left to right) */}
                    <ExpoLinearGradient
                      pointerEvents="none"
                      colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientLayer}
                    />

                    {/* Brightness gradient (transparent to black, top to bottom) */}
                    <ExpoLinearGradient
                      pointerEvents="none"
                      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.gradientLayer}
                    />

                    <Animated.View
                      pointerEvents="none"
                      style={[styles.pickerKnob, pickerKnobStyle]}
                    />
                  </View>
                </GestureDetector>
              </View>

              {/* Hue Bar */}
              <View style={styles.hueContainer}>
                <GestureDetector gesture={hueGesture}>
                  <View
                    style={{ width: PICKER_SIZE, height: HUE_BAR_HEIGHT }}
                    collapsable={false}
                  >
                    <Svg
                      pointerEvents="none"
                      width={PICKER_SIZE}
                      height={HUE_BAR_HEIGHT}
                    >
                      <Defs>
                        <LinearGradient
                          id="hue"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="0%"
                        >
                          <Stop offset="0%" stopColor="#ff0000" />
                          <Stop offset="16.66%" stopColor="#ffff00" />
                          <Stop offset="33.33%" stopColor="#00ff00" />
                          <Stop offset="50%" stopColor="#00ffff" />
                          <Stop offset="66.66%" stopColor="#0000ff" />
                          <Stop offset="83.33%" stopColor="#ff00ff" />
                          <Stop offset="100%" stopColor="#ff0000" />
                        </LinearGradient>
                      </Defs>
                      <Rect
                        width={PICKER_SIZE}
                        height={HUE_BAR_HEIGHT}
                        fill="url(#hue)"
                        rx={10}
                      />
                    </Svg>

                    <Animated.View
                      pointerEvents="none"
                      style={[styles.hueKnob, hueKnobStyle]}
                    />
                  </View>
                </GestureDetector>
              </View>
            </View>
          </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  pickerContainer: {
    marginBottom: 20,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
  },
  colorBase: {
    position: 'absolute',
    width: PICKER_SIZE,
    height: PICKER_SIZE,
    borderRadius: BORDER_RADIUS,
  },
  gradientLayer: {
    position: 'absolute',
    width: PICKER_SIZE,
    height: PICKER_SIZE,
    borderRadius: 12,
  },
  pickerKnob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  hueContainer: {
    borderRadius: CORNERS,
    overflow: 'hidden',
  },
  hueKnob: {
    position: 'absolute',
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: 'white',
    opacity: 0.8,
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
