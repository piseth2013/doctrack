import { supabase } from './supabase';

export async function uploadLogo(file: File) {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `logo_${timestamp}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from('logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    return {
      path: data.path,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error uploading logo:', error);
    throw error;
  }
}