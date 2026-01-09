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
    
    await chrome.storage.local.set({ last_summary: "Analyse en cours par Gemini..." });
    
    const data = await chrome.storage.local.get('gemini_api_key');
    if (!data.gemini_api_key) {
      showError("Clé API manquante.");
      return;
    }

    notify("Gemini analyse le lien...");

    try {
      // Note: On utilise le modèle flash-thinking pour accepter les "thoughts"
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${data.gemini_api_key}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Résume-moi le contenu de cette page ou le contenu du vidéo si c'est un vidéo sur youtube. Mentionnez le URL au début de votre réponse : ${linkUrl}` }]
          }]
        })
      });

      const result = await response.json();
      console.log("Réponse complète de Google:", result);

      if (result.error) throw new Error(result.error.message);

      // Extraction intelligente du texte
      let summary = "";
      const candidate = result.candidates?.[0];
      
      if (candidate && candidate.content && candidate.content.parts) {
        // On cherche la partie qui contient du texte et qui n'est pas juste de la réflexion
        const textPart = candidate.content.parts.find(p => p.text && p.text.length > 0);
        summary = textPart ? textPart.text : "L'IA a réfléchi mais n'a pas renvoyé de texte final.";
      } else {
        summary = "Structure de réponse inconnue. Vérifiez la console du worker.";
      }

      await chrome.storage.local.set({ last_summary: summary });
      chrome.tabs.create({ url: 'result.html' });

    } catch (error) {
      console.error("Erreur:", error);
      showError(error.message);
    }
  }
});

function notify(msg) {
  chrome.notifications.create({ type: 'basic', iconUrl: 'icon.png', title: 'SummarizeIt', message: msg });
}

function showError(msg) {
  chrome.notifications.create({ type: 'basic', iconUrl: 'icon.png', title: 'Erreur', message: msg });
}