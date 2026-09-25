UPDATE public.barbers SET user_id=NULL, is_active=false WHERE id='022f4471-bdf2-4249-8f36-52e942a19fb7';
DELETE FROM public.user_roles WHERE user_id='a7b2ca8d-8c11-4f0a-bb0f-c6e308c06ed7';
DELETE FROM public.audit_logs WHERE details->>'user_id'='a7b2ca8d-8c11-4f0a-bb0f-c6e308c06ed7';
DELETE FROM auth.users WHERE id='a7b2ca8d-8c11-4f0a-bb0f-c6e308c06ed7';
DELETE FROM public.barbers WHERE id='11111111-2222-4333-8444-555555555555';