This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

- set local environment variables into `.envrc`

```bash
export API_URL_BASE=http://localhost:9080

export AWS_COGNITO_AUTH_REGION=<YOUR_AWS_COGNITO_AUTH_REGION>

# morningcode
export AWS_COGNITO_AUTH_USER_POOL_ID=<YOUR_AWS_COGNITO_AUTH_USER_POOL_ID>
export AWS_COGNITO_AUTH_USER_POOL_WEB_CLIENT_ID=<YOUR_AWS_COGNITO_AUTH_USER_POOL_WEB_CLIENT_ID>
```

- enable env

```bash
direnv allow .
```

- then start application

```bash
npm run dev
```
