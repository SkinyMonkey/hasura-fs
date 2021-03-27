CREATE UNIQUE INDEX file_parent_id_is_null_name_key ON public.file (name, (parent_id IS NULL)) WHERE parent_id IS NULL;
