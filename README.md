# AfriChat

AfriChat is Africa's super app for communication, payments, commerce, services, and AI.

AfriAI includes built-in chat, business help, translation across African languages, and instant thread summarization.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `AI_API_KEY` in [.env.local](.env.local)
3. Run the app:
   `npm run dev`

If port `3000` is already in use, run `PORT=3001 npm run dev`.

## Production

1. Set `AI_API_KEY` in your hosting environment so AfriAI can use the live model path.
2. Build the client and server bundle:
   `npm run build`
3. Start the production server:
   `npm run start`

Set `NODE_ENV=production` in the hosting environment so AfriAI uses the live API path.
