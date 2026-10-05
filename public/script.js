// public/script.js
let tokenGoogle = null;

// Função chamada automaticamente pelo Google ao carregar a página
window.onload = function () {
  /* global google */
  google.accounts.id.initialize({
    client_id: "110788931701-lilku8ff0ma528j0b7ro5svit0t0ucbo.apps.googleusercontent.com",
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("botao-google"),
    { theme: "outline", size: "large" }
  );
};

function handleCredentialResponse(response) {
  tokenGoogle = response.credential;
  document.getElementById("btn-desenhar").disabled = false;
  document.getElementById("mensagem").textContent = "Login efetuado com sucesso! Escolha um número e clique em Desenhar.";
}

const formulario = document.getElementById("formulario");
const btnDesenhar = document.getElementById("btn-desenhar");
const elementoDesenho = document.getElementById("desenho");
const btnBaixar = document.getElementById("baixar");
const mensagem = document.getElementById("mensagem");

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();

  const numero = parseInt(document.getElementById("numero").value, 10);

  if (!tokenGoogle) {
    mensagem.textContent = "Por favor, faça login com o Google primeiro.";
    return;
  }

  btnDesenhar.disabled = true;
  mensagem.textContent = "Gerando desenho...";

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenGoogle}`
      },
      body: JSON.stringify({ numero })
    });

    if (!resposta.ok) {
      throw new Error(`Erro no servidor: ${resposta.status}`);
    }

    const svgText = await resposta.text();
    elementoDesenho.innerHTML = svgText;
    btnBaixar.hidden = false;
    mensagem.textContent = "";
  } catch (erro) {
    mensagem.textContent = "Erro ao gerar o desenho: " + erro.message;
  } finally {
    btnDesenhar.disabled = false;
  }
});

btnBaixar.addEventListener("click", () => {
  const svgData = elementoDesenho.innerHTML;
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "exemplo.svg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});