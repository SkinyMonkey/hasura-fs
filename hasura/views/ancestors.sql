-- compute the ancestors permissions of a file
DROP VIEW ancestors_permissinos;
CREATE VIEW ancestors_permissions AS
SELECT permission.path, permission.role, file.id as file_id FROM permission INNER JOIN file ON file.path <@ permission.path;
