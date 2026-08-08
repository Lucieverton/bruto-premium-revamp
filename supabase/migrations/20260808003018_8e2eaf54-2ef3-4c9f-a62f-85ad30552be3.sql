CREATE POLICY "Admins can upload site images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'site' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update site images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'site' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'site' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete site images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'site' AND has_role(auth.uid(), 'admin'::app_role));