const output = document.getElementById('output');

function check() {
  chrome.storage.local.get('last_summary', (data) => {
    if (data.last_summary && data.last_summary !== "Analyse en cours par Gemini...") {
      // Transformation basique du Markdown en HTML
      let text = data.last_summary
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Gras
        .replace(/\n/g, '<br>'); // Retours à la ligne
      
      output.innerHTML = text;
      output.classList.remove('loader');
    } else {
      setTimeout(check, 300); // On re-vérifie toutes les 300ms
    }
  });
}

// On lance la vérification au chargement
check();