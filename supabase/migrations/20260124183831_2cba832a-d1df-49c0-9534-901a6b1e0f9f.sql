-- Create storage bucket for barber avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Anyone can read avatars (public)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Only the user that owns the barber profile can upload their avatar
CREATE POLICY "Barbers can upload own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM barbers
    WHERE user_id = auth.uid()
      AND id::text = (storage.foldername(name))[1]
  )
);

-- Only the user that owns the barber profile can update their avatar
CREATE POLICY "Barbers can update own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM barbers
    WHERE user_id = auth.uid()
      AND id::text = (storage.foldername(name))[1]
  )
);

-- Only the user that owns the barber profile can delete their avatar
CREATE POLICY "Barbers can delete own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND EXISTS (
    SELECT 1 FROM barbers
    WHERE user_id = auth.uid()
      AND id::text = (storage.foldername(name))[1]
  )
);
