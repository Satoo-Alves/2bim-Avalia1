// functions/api/desenho.js
import { gerarDesenho } from "../../lib/desenho.js";

export async function onRequest(context) {
  const { request, env } = context;

  // 1. Verifica o método HTTP
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // 2. Lê e valida o corpo
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Bad Request: JSON inválido", { status: 400 });
  }

  const numero = body.numero;
  if (
    numero === undefined ||
    numero === null ||
    !Number.isInteger(numero) ||
    numero < 1 ||
    numero > 100
  ) {
    return new Response("Bad Request: numero inválido", { status: 400 });
  }

  // 3. Verifica o token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized: token ausente", { status: 401 });
  }

  const token = authHeader.slice(7); // remove "Bearer "

  // Chama o endpoint do Google para validar o token
  const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`;
  const tokenResponse = await fetch(tokenInfoUrl);

  if (tokenResponse.status !== 200) {
    return new Response("Unauthorized: token inválido ou expirado", { status: 401 });
  }

  const tokenData = await tokenResponse.json();

  // Verifica se o audience (aud) é o nosso Client ID
  if (tokenData.aud !== env.GOOGLE_CLIENT_ID) {
    return new Response("Unauthorized: aud inválido", { status: 401 });
  }

  // Verifica se o e-mail está verificado
  if (tokenData.email_verified !== "true" && tokenData.email_verified !== true) {
    return new Response("Unauthorized: e-mail não verificado", { status: 401 });
  }

  const email = tokenData.email;

  // 4. Gera o desenho no servidor
  const svg = gerarDesenho(numero, email);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml"
    }
  });
}