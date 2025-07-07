## Requirements

[x] [NestJS CLI](https://docs.nestjs.com/cli/overview)

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Create new app

1. create app/library from [nestjs cli](https://docs.nestjs.com/cli/overview)

```bash
nest g (app|library) <(app|library)-name>
<enter prefix @app>
```

2. edit tsconfig.json

```json
{
  "compilerOptions": {
    ...

    "paths": {
      "@app/auth": ["apps/auth/src"],
      "@app/auth/*": ["apps/auth/src/*"],
      "@lib/infra": ["libs/infra/src"],
      "@lib/infra/*": ["libs/infra/src/*"],

      ...

      "@app/<app-name>": ["apps/<app-name>/src"],
      "@lib/<lib-name>/*": ["apps/<lib-name>/src/*"]
    }
  }
}
```

3. edit package.json

```json
{
  "name": "<project-name>",
  ...
  "jest": {
    ...
    "moduleNameMapper": {
      "^@app/auth(|/.*)$": "<rootDir>/apps/auth/src/$1",
      ...
      "^@app/<app-name>(|/.*)$": "<rootDir>/apps/<app-name>/src/$1"
      "^@lib/<lib-name>(|/.*)$": "<rootDir>/libs/<lib-name>/src/$1"
    }
  }
}
```
