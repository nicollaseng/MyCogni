INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('narration', 'narration', true, 20971520, ARRAY['audio/mpeg', 'application/json'])
ON CONFLICT (id) DO NOTHING;
