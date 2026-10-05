// script.js — versão final com autenticação Google + chamada à API

const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");
const botaoDesenhar = document.getElementById("btn-desenhar");

let svgAtual = "";
let idToken = null; // guardamos o token do Google aqui

// ========== 1. Configuração do Google Identity Services ==========
function inicializarGoogle() {
  google.accounts.id.initialize({
    client_id: "COLE_SEU_CLIENT_ID_AQUI", // ← substitua pelo seu Client ID
    callback: handleCredentialResponse,
    auto_select: false
  });

  // Renderiza o botão
  google.accounts.id.renderButton(
    document.getElementById("botao-google"),
    {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular"
    }
  );
}

// Quando o usuário faz login, o Google chama esta função
function handleCredentialResponse(response) {
  idToken = response.credential; // este é o id_token (JWT)
  botaoDesenhar.disabled = false;
  mensagem.textContent = "Login realizado com sucesso. Agora escolha um número e clique em Desenhar.";
  mensagem.style.color = "#3fb950"; // verde
}

// ========== 2. Envio do formulário ==========
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";
  mensagem.style.color = ""; // volta à cor de erro padrão

  const numero = Number(campoNumero.value);

  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    mensagem.textContent = "Digite um inteiro entre 1 e 100.";
    return;
  }

  if (!idToken) {
    mensagem.textContent = "Faça login com o Google antes de desenhar.";
    return;
  }

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ numero })
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Erro 400: número inválido ou corpo da requisição incorreto.";
      return;
    }

    if (resposta.status === 401) {
      mensagem.textContent = "Erro 401: token inválido, expirado ou e-mail não verificado. Faça login novamente.";
      idToken = null;
      botaoDesenhar.disabled = true;
      return;
    }

    if (!resposta.ok) {
      mensagem.textContent = `Erro inesperado: ${resposta.status}`;
      return;
    }

    // Sucesso: a resposta é o SVG puro
    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;

  } catch (erro) {
    mensagem.textContent = "Erro de rede ao chamar a API.";
    console.error(erro);
  }
});

// ========== 3. Botão de baixar ==========
botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = "exemplo.svg";
  link.click();
  URL.revokeObjectURL(url);
});

// Inicializa o Google quando a página carregar
window.onload = inicializarGoogle;
