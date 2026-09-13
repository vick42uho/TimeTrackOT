import { Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export interface PickImageResult {
  success: boolean;
  uri?: string;
  canceled?: boolean;
  error?: string;
}

/**
 * Copies a selected image URI to the app's permanent document directory.
 * This guarantees the image remains accessible even if the user deletes it from their system photo gallery.
 */
export async function saveAttachmentPermanently(
  tempUri: string,
  prefix: string = 'attachment'
): Promise<string> {
  if (Platform.OS === 'web') {
    return tempUri;
  }

  try {
    const docDir = FileSystem.documentDirectory;
    if (!docDir) {
      return tempUri;
    }

    const fileExtension = tempUri.split('.').pop()?.split('?')[0] || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(fileExtension.toLowerCase())
      ? fileExtension.toLowerCase()
      : 'jpg';

    const targetFileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;
    const targetPath = `${docDir}${targetFileName}`;

    await FileSystem.copyAsync({
      from: tempUri,
      to: targetPath,
    });

    return targetPath;
  } catch (error) {
    console.error('Error saving attachment permanently:', error);
    return tempUri;
  }
}

/**
 * Safely deletes an attachment file from the app's document directory.
 */
export async function deleteAttachmentFile(uri?: string): Promise<void> {
  if (!uri || Platform.OS === 'web') return;

  try {
    const docDir = FileSystem.documentDirectory;
    // Only delete if the file is inside our app's documentDirectory to avoid accidental deletions of system photos
    if (docDir && uri.startsWith(docDir)) {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    }
  } catch (error) {
    console.warn('Could not delete attachment file:', error);
  }
}

export interface AttachmentPickerOptions {
  prefix?: string;
  permissionMessage?: string;
}

/**
 * Prompts user for camera permission and opens camera to capture a photo.
 */
export async function takePhotoWithCamera(options?: AttachmentPickerOptions): Promise<PickImageResult> {
  try {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ต้องใช้สิทธิ์เข้าถึงกล้อง',
          options?.permissionMessage || 'กรุณาอนุญาตให้แอปเข้าถึงกล้องถ่ายรูปในการตั้งค่า เพื่อถ่ายรูปภาพหลักฐานหรือเอกสารแนบ',
          [{ text: 'ตกลง' }]
        );
        return { success: false, error: 'Camera permission denied' };
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return { success: false, canceled: true };
    }

    const permanentUri = await saveAttachmentPermanently(
      result.assets[0].uri,
      options?.prefix || 'attachment'
    );
    return { success: true, uri: permanentUri };
  } catch (error: any) {
    console.error('Error in takePhotoWithCamera:', error);
    return { success: false, error: error?.message || 'Failed to capture photo' };
  }
}

/**
 * Prompts user for media library permission and opens image picker.
 */
export async function pickImageFromGallery(options?: AttachmentPickerOptions): Promise<PickImageResult> {
  try {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'ต้องใช้สิทธิ์เข้าถึงคลังรูปภาพ',
          options?.permissionMessage || 'กรุณาอนุญาตให้แอปเข้าถึงคลังรูปภาพในการตั้งค่า เพื่อเลือกรูปภาพหลักฐานหรือเอกสารแนบ',
          [{ text: 'ตกลง' }]
        );
        return { success: false, error: 'Media library permission denied' };
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return { success: false, canceled: true };
    }

    const permanentUri = await saveAttachmentPermanently(
      result.assets[0].uri,
      options?.prefix || 'attachment'
    );
    return { success: true, uri: permanentUri };
  } catch (error: any) {
    console.error('Error in pickImageFromGallery:', error);
    return { success: false, error: error?.message || 'Failed to pick image' };
  }
}
