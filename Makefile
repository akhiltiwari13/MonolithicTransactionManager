SHELL=/bin/bash

export PGPASSWORD ?= $(POSTGRES_PASSWORD)

export DB_ENTRY ?= psql -h $(POSTGRES_HOST) -p $(POSTGRES_PORT) -U $(POSTGRES_USER)

link_local_dependencies:
	@linklocal -r

start:
	@node ./bin/www

clean:
	@rm -rf ./dist

lint:
	./node_modules/.bin/standard --fix

dev:
	@node_modules/.bin/nodemon --inspect=0.0.0.0:9229 ./bin/dev

build: clean
	@npx babel . -d ./dist -s \
		--copy-files \
		--extensions ".js,.jsx,.ts,.tsx" \
		--verbose \
		--ignore dist,node_modules,yarn-v1.5.1,__mocks__,chart,node_modules,common/node_modules,postman,test

start_prod_server:
	@node dist/main.js

create:
	@$(DB_ENTRY) ${DEFAULT_DB} -c 'CREATE DATABASE "${DB_NAME}"';
