INSERT INTO public.site_gallery_items (gallery, url, title, sort_order, is_active)
SELECT * FROM (VALUES
  ('portfolio','https://ezvqqvkvyrriozgegrgn.supabase.co/storage/v1/object/public/avatars/site%2Fportfolio-seed-1.png','Corte profissional com design',0,true),
  ('portfolio','https://ezvqqvkvyrriozgegrgn.supabase.co/storage/v1/object/public/avatars/site%2Fportfolio-seed-2.png','Trança estilizada com fade',1,true),
  ('portfolio','https://ezvqqvkvyrriozgegrgn.supabase.co/storage/v1/object/public/avatars/site%2Fportfolio-seed-3.png','Fade com design artístico',2,true),
  ('portfolio','https://ezvqqvkvyrriozgegrgn.supabase.co/storage/v1/object/public/avatars/site%2Fportfolio-seed-4.png','Corte platinado elegante',3,true),
  ('portfolio','https://ezvqqvkvyrriozgegrgn.supabase.co/storage/v1/object/public/avatars/site%2Fportfolio-seed-5.png','Corte infantil com degradê',4,true),
  ('portfolio','https://ezvqqvkvyrriozgegrgn.supabase.co/storage/v1/object/public/avatars/site%2Fportfolio-seed-6.png','Design criativo com degradê',5,true),
  ('portfolio','https://ezvqqvkvyrriozgegrgn.supabase.co/storage/v1/object/public/avatars/site%2Fportfolio-seed-7.png','Fade artístico com design',6,true)
) AS v(gallery,url,title,sort_order,is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.site_gallery_items WHERE gallery = 'portfolio');