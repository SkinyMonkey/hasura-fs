CREATE FUNCTION public.parent_is_folder() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE _is_folder BOOLEAN;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;
  SELECT is_folder FROM file WHERE id=NEW.parent_id INTO _is_folder;
  IF NOT _is_folder THEN
    RAISE EXCEPTION 'parent_id isnt a folder';
  END IF;
  RETURN NEW;
END;
$$;
CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
CREATE TABLE public.file (
    name text NOT NULL,
    parent_id uuid,
    size integer DEFAULT 0 NOT NULL,
    metadata json DEFAULT json_build_object() NOT NULL,
    owner_id uuid NOT NULL,
    is_folder boolean DEFAULT false NOT NULL,
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    state text DEFAULT 'uploading'::text NOT NULL
);
CREATE TABLE public.file_state (
    name text NOT NULL
);
CREATE TABLE public.fs_user (
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    state text DEFAULT 'created'::text NOT NULL
);
CREATE TABLE public.fs_user_state (
    name text NOT NULL
);
CREATE TABLE public.permission (
    owner_id uuid NOT NULL,
    beneficiary_id uuid NOT NULL,
    role text NOT NULL,
    id uuid DEFAULT public.gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    file_id uuid NOT NULL
);
CREATE TABLE public.role (
    name text NOT NULL
);
ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_parent_id_name_key UNIQUE (parent_id, name);
ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.file_state
    ADD CONSTRAINT file_state_pkey PRIMARY KEY (name);
ALTER TABLE ONLY public.fs_user
    ADD CONSTRAINT fs_user_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY public.fs_user_state
    ADD CONSTRAINT fs_user_state_pkey PRIMARY KEY (name);
ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_owner_id_beneficiary_id_role_file_id_key UNIQUE (owner_id, beneficiary_id, role, file_id);
ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (name);
CREATE TRIGGER set_public_file_updated_at BEFORE UPDATE ON public.file FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_file_updated_at ON public.file IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_fs_user_updated_at BEFORE UPDATE ON public.fs_user FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_fs_user_updated_at ON public.fs_user IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE TRIGGER set_public_permission_updated_at BEFORE UPDATE ON public.permission FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_permission_updated_at ON public.permission IS 'trigger to set value of column "updated_at" to current timestamp on row update';
ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.fs_user(user_id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.file(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.file
    ADD CONSTRAINT file_state_fkey FOREIGN KEY (state) REFERENCES public.file_state(name) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.fs_user
    ADD CONSTRAINT fs_user_state_fkey FOREIGN KEY (state) REFERENCES public.fs_user_state(name) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_beneficiary_id_fkey FOREIGN KEY (beneficiary_id) REFERENCES public.fs_user(user_id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_file_id_fkey FOREIGN KEY (file_id) REFERENCES public.file(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.fs_user(user_id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.permission
    ADD CONSTRAINT permission_role_fkey FOREIGN KEY (role) REFERENCES public.role(name) ON UPDATE CASCADE ON DELETE CASCADE;
