document.getElementById('save').addEventListener('click', () => {
  const key = document.getElementById('apiKey').value;
  chrome.storage.local.set({ gemini_api_key: key }, () => {
    document.getElementById('status').textContent = 'Clé sauvegardée !';
  });
});

// Charger la clé existante
chrome.storage.local.get('gemini_api_key', (res) => {
  if (res.gemini_api_key) document.getElementById('apiKey').value = res.gemini_api_key;
});