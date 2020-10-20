docker-compose up -d;
sleep 5;
cd hasura;
hasura migrate apply migrations/*_init;
hasura seeds apply seeds/*.sql;
hasura metadata apply .;
cd -
cd api;
yarn install;
yarn tests;
cd -;
