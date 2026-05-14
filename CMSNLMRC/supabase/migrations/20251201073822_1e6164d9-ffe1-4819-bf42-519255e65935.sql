-- Remove unique constraint from client_id to allow duplicate intake numbers
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_client_id_key;