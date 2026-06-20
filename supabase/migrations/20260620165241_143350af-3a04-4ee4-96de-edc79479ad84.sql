
CREATE POLICY "community-media read auth" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'community-media');
CREATE POLICY "community-media insert own folder" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "community-media update own" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "community-media delete own" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'community-media' AND auth.uid()::text = (storage.foldername(name))[1]
  );
