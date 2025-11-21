import { buildSolvedMessage } from "./module/dmessage";

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(req, env){
    if (req.method !== 'POST') {
      if (req.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers
        });
      }
      return new Response('Method Not Allowed', { status: 405, headers});
    }
    if (!req.headers.get('Content-Type')?.startsWith('application/json')) {
      return new Response('Invalid Content-Type', { status: 400, headers});
    }
    let requestBody
    try {
      requestBody = await req.json()
    } catch {
      console.error("Not a valid JSON");
      return new Response('The request body is not valid', {
        status: 400,
        headers
      })
    }

    if (!requestBody.challengeId || requestBody.test === undefined || !requestBody.solver) {
      console.error(JSON.stringify(requestBody));
      return new Response('Invalid request body', {
        status: 400,
        headers
      })
    }

    console.log(`Solver Info: ${JSON.stringify(requestBody.solver)}`);

    try{
      const content = await buildSolvedMessage(requestBody.challengeId, requestBody.solver, requestBody.test);
      console.log(`Message Sent: ${JSON.stringify(content)}`);
      const response = await fetch(
        new Request(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(content)
        })
      )
      if (!response.ok) {
        console.error(await response.text());
        return new Response('Discord webhook failed', {
          status: 500,
          headers
        })
      }
      return new Response("ok", {
        status: 200,
        headers
      })
    } catch(error){
      console.error(error);
      return new Response('Internal Server Error', {
        status: 500,
        headers
      })
    }
  }
}