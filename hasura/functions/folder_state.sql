--drop trigger file_path_trigger on file;

-- Error returned by hasura : "syntax error at position 0"
create or replace function folder_state_trigger ()
returns trigger language plpgsql as $$
begin
  if new.is_folder=true then
    new.state := 'ready';
  end if;
  return new;
end $$;

create trigger folder_state_trigger
before insert on file
for each row execute procedure folder_state_trigger();
