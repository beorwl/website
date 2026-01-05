import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];
    const additionalContext = formData.get('additionalContext') as string;
    const email = formData.get('email') as string;
    const contactMethod = formData.get('contactMethod') as string;
    const contactInfo = formData.get('contactInfo') as string;

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate a single submission ID for all files
    const submissionId = `SUB_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const uploadResults = [];

    // Process each file
    for (const file of files) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        return new Response(JSON.stringify({ error: `Invalid file type for "${file.name}". Only PDF, DOC, and DOCX are allowed.` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        return new Response(JSON.stringify({ error: `File "${file.name}" exceeds 10MB limit` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `contract_${submissionId}_${randomString}.${fileExtension}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(uniqueFileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return new Response(JSON.stringify({ error: 'Failed to upload file' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      uploadResults.push({
        fileName: file.name,
        filePath: uploadData.path,
        fileSize: file.size,
        fileType: file.type
      });
    }

    // Store metadata in database
    const { data: dbData, error: dbError } = await supabase
      .from('contract_submissions')
      .insert({
        submission_id: submissionId,
        files: uploadResults,
        additional_context: additionalContext || null,
        email: email || null,
        contact_method: contactMethod,
        contact_info: contactInfo,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up the uploaded files
      for (const result of uploadResults) {
        await supabase.storage.from('contracts').remove([result.filePath]);
      }
      return new Response(JSON.stringify({ error: 'Failed to save submission data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      submissionId: dbData.id,
      message: 'Contracts uploaded successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
