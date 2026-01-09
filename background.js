chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "summarizeLink",
    title: "Sommarizez-moi ceci",
    contexts: ["link"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "summarizeLink") {
    const linkUrl = info.linkUrl;
    const data = await chrome.storage.local.get('gemini_api_key');
    
    if (!data.gemini_api_key) {
      showError("Clé API manquante. Cliquez sur l'icône de l'extension.");
      return;
    }

    notify("Analyse en cours...");

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${data.gemini_api_key}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Explique-moi brièvement ce qu'il y a derrière ce lien et fais-en un résumé : ${linkUrl}` }]
          }]
        })
      });

      const result = await response.json();

      // DEBUG: On affiche la réponse brute dans la console pour comprendre
      console.log("Réponse de Google:", result);

      if (result.error) {
        throw new Error(`Erreur Google API: ${result.error.message}`);
      }

      if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts) {
        const summary = result.candidates[0].content.parts[0].text;
        await chrome.storage.local.set({ last_summary: summary });
        chrome.tabs.create({ url: 'result.html' });
      } else {
        // Si c'est vide, c'est souvent dû aux filtres de sécurité
        const reason = result.promptFeedback?.blockReason || "Contenu bloqué par les filtres de sécurité de Google.";
        throw new Error(reason);
      }

    } catch (error) {
      console.error("Détail de l'erreur:", error);
      showError(error.message);
    }
  }
});

// Fonctions utilitaires pour les messages
function notify(msg) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'SummarizeIt',
    message: msg
  });
}

function showError(msg) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'Erreur',
    message: msg
  });
}