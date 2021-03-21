CREATE OR REPLACE FUNCTION public.ancestors(f file)
 RETURNS SETOF file
 LANGUAGE sql
 STABLE
AS $function$
SELECT * FROM file WHERE path @> (
    SELECT path FROM file WHERE path = f.path
);
$function$
