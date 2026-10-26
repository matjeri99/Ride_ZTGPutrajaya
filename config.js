// CONFIG FILE — Configure before sharing the GitHub Pages link.
// The Google Sheet itself should remain PRIVATE; Apps Script publishes only public ride fields.
// Do not put passwords, Firebase service-account keys or secret API keys here.
window.RIDE_CONFIG = {
  rideId: 'CAM2026',
  sheetEditUrl: 'https://docs.google.com/spreadsheets/d/16RRcM5o2-p18DGZ8RnYecVsU_CVU9Rzznu7aDbI0484/edit',
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbwWIsWkKlLvganKfYk0EASPkf5yYLlY8Bcw0X6TgNyY6XrBMe5v32D4X4w15N8DsTFI/exec', // After deploying apps-script/Code.gs, paste Web App /exec URL here
  firebase: {
    apiKey: 'AIzaSyCC75Qx0MZ9sXZkBliOtJ0OhX9lCYr-d8k', // Firebase WEB API key is public; never use admin/service-account credentials
    authDomain: 'zontes-putrajaya-ride-hub.firebaseapp.com',
    projectId: 'zontes-putrajaya-ride-hub',
    appId: '1:797154096007:web:26dcece12208f7af1bd922'
  },
  oldRideHubUrl: 'https://zontes-cameron-ride-2026.matjeri99.chatgpt.site',
  oldChatUrl: 'https://zontes-cameron-ride-2026.matjeri99.chatgpt.site/crew'
};
