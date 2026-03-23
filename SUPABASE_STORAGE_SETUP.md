# Supabase Storage Setup for Documents

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click "Storage" in the left sidebar
4. Click "Create a new bucket"
5. Enter bucket name: **`documents`**
6. Set bucket to **Public** (so uploaded files are accessible)
7. Click "Create bucket"

## Step 2: Set Storage Policies

After creating the bucket, set up policies to allow file operations:

1. Click on the **documents** bucket
2. Go to "Policies" tab
3. Click "New Policy"
4. Create the following policies:

### Policy 1: Allow Public Uploads
```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'documents');
```

### Policy 2: Allow Public Downloads
```sql
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

### Policy 3: Allow Public Deletes
```sql
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'documents');
```

## Step 3: Update Database Schema

Run this in Supabase SQL Editor:

```sql
-- Add file-related columns to Document table
ALTER TABLE "Document" 
ADD COLUMN IF NOT EXISTS "fileUrl" TEXT,
ADD COLUMN IF NOT EXISTS "fileName" TEXT,
ADD COLUMN IF NOT EXISTS "fileType" TEXT;
```

Or run the migration file: `document_file_storage_migration.sql`

## Step 4: Test Upload

1. Refresh your Fleet Management System
2. Go to Documents section
3. Upload a document with a file
4. Check Supabase Storage to verify the file was uploaded

## File Structure

Uploaded files will be stored in Supabase Storage with this structure:
```
documents/
  ├── 1708172934567-abc123.pdf
  ├── 1708172945678-def456.jpg
  ├── 1708172956789-ghi789.png
  └── ...
```

Files are named with timestamp + random string to ensure uniqueness.

## Supported File Types

- **Images**: JPG, PNG, GIF, WebP (preview available)
- **Documents**: PDF, DOC, DOCX
- **Others**: Any file type can be uploaded

## Storage Limits

- Free tier: 1 GB storage
- Pro tier: 100 GB storage
- Files persist across refreshes and server restarts
- Files are backed up by Supabase

## Verification

To verify everything is working:

1. Upload a document with an image file
2. Refresh the page
3. Click "View" on the document
4. The image/file should display correctly
5. Check Supabase Dashboard > Storage > documents bucket to see the uploaded file

✅ Your documents and files are now permanently stored in Supabase Storage!
