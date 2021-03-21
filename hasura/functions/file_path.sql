--drop trigger file_path_trigger on file;

-- Error returned by hasura : "syntax error at position 0"
create or replace function file_path_trigger ()
returns trigger language plpgsql as $$
begin
  if new.parent_id=null then
    new.path := CONCAT('root.', new.name);
  else
    new.path := CONCAT((select path from file where id=new.parent_id), '.', new.name);
  end if;
  return new;
end $$;

create trigger file_path_trigger
before insert or update on file
for each row execute procedure file_path_trigger();
