import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { useColor } from '@/hooks/useColor';
import { useHaptics } from '@/hooks/useHaptics';
import { BORDER_RADIUS, CORNERS, FONT_SIZE, HEIGHT } from '@/theme/globals';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  ScrollView,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

// Types
interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
  tabValues: string[];
  registerTab: (value: string) => void;
  unregisterTab: (value: string) => void;
  enableSwipe?: boolean;
  haptic?: boolean;
}

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  style?: ViewStyle;
  enableSwipe?: boolean;
  haptic?: boolean;
}

interface TabsListProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  style?: ViewStyle;
}

// Context
const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

export function Tabs({
  children,
  defaultValue = '',
  value,
  onValueChange,
  orientation = 'horizontal',
  style,
  enableSwipe = false,
  haptic = true,
}: TabsProps) {
  const feedback = useHaptics(haptic);
  const [internalActiveTab, setInternalActiveTab] = useState(defaultValue);
  const [tabValues, setTabValues] = useState<string[]>([]);

  // Determine if we're in controlled or uncontrolled mode
  const isControlled = value !== undefined;
  const activeTab = isControlled ? value : internalActiveTab;

  // Update internal state when value prop changes (controlled mode)
  useEffect(() => {
    if (isControlled && value !== internalActiveTab) {
      setInternalActiveTab(value);
    }
  }, [value, isControlled, internalActiveTab]);

  const setActiveTab = (newValue: string) => {
    if (!isControlled) {
      setInternalActiveTab(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  const registerTab = useCallback((tabValue: string) => {
    setTabValues((prev) => {
      if (!prev.includes(tabValue)) {
        return [...prev, tabValue];
      }
      return prev;
    });
  }, []);

  const unregisterTab = useCallback((tabValue: string) => {
    setTabValues((prev) => prev.filter((val) => val !== tabValue));
  }, []);

  return (
    <TabsContext.Provider
      value={{
        activeTab,
        setActiveTab,
        orientation,
        tabValues,
        registerTab,
        unregisterTab,
        enableSwipe,
        haptic,
      }}
    >
      <View
        style={[
          {
            flex: 1,
            flexDirection: orientation === 'horizontal' ? 'column' : 'row',
          },
          style,
        ]}
      >
        {children}
      </View>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, style, scrollable = false }: TabsListProps) {
  const { orientation } = useTabsContext();
  const backgroundColor = useColor('muted');
  const borderColor = useColor('border');

  if (scrollable && orientation === 'horizontal') {
    return (
      <View
        accessibilityRole='tablist'
        style={[
          {
            padding: 4,
            backgroundColor,
            borderRadius: 999,
            borderWidth: 1.3,
            borderColor,
          },
          style,
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      accessibilityRole='tablist'
      style={[
        {
          padding: 4,
          backgroundColor,
          borderRadius: orientation === 'horizontal' ? 999 : 20,
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1.3,
          borderColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function TabsTrigger({
  children,
  value,
  disabled = false,
  style,
  textStyle,
}: TabsTriggerProps) {
  const {
    activeTab,
    setActiveTab,
    orientation,
    registerTab,
    unregisterTab,
    haptic,
  } = useTabsContext();
  const isActive = activeTab === value;
  const feedback = useHaptics(haptic ?? true);

  // Register/unregister tab
  useEffect(() => {
    registerTab(value);
    return () => unregisterTab(value);
  }, [value, registerTab, unregisterTab]);

  const textColor = useColor('text');
  const mutedForegroundColor = useColor('mutedForeground');
  const backgroundColor = useColor('card');
  const borderColor = useColor('border');

  const handlePress = () => {
    if (!disabled) {
      if (!isActive) feedback('selection');
      setActiveTab(value);
    }
  };

  const triggerStyle: ViewStyle = {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: HEIGHT - 10,
    backgroundColor: isActive ? backgroundColor : 'transparent',
    borderWidth: isActive ? 1.2 : 0,
    borderColor: isActive ? borderColor : 'transparent',
    opacity: disabled ? 0.5 : 1,
    flex: orientation === 'horizontal' ? 1 : undefined,
    marginBottom: orientation === 'vertical' ? 4 : 0,
    ...style,
  };

  const triggerTextStyle: TextStyle = {
    fontSize: 12,
    fontWeight: isActive ? '700' : '500',
    color: isActive ? textColor : mutedForegroundColor,
    fontFamily: isActive ? 'Sarabun_700Bold' : 'Sarabun_500Medium',
    textAlign: 'center',
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={triggerStyle}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole='tab'
      accessibilityState={{ selected: isActive, disabled }}
    >
      {React.isValidElement(children) ? (
        children
      ) : (
        <Text style={triggerTextStyle}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

export function TabsContent({ children, value, style }: TabsContentProps) {
  const { activeTab } = useTabsContext();
  const isActive = activeTab === value;

  // Only render active content
  if (!isActive) {
    return null;
  }

  return (
    <View
      style={[
        {
          flex: 1,
          paddingTop: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
