// CONFIG FILE — Configure before sharing the GitHub Pages link.
// The Google Sheet itself should remain PRIVATE; Apps Script publishes only public ride fields.
// Do not put passwords, Firebase service-account keys or secret API keys here.
window.RIDE_CONFIG = {
  rideId: 'CAM2026',
  sheetEditUrl: 'https://docs.google.com/spreadsheets/d/16RRcM5o2-p18DGZ8RnYecVsU_CVU9Rzznu7aDbI0484/edit',
  appsScriptUrl: '', // After deploying apps-script/Code.gs, paste Web App /exec URL here
  firebase: {
    apiKey: '', // Firebase WEB API key is public; never use admin/service-account credentials
    authDomain: '',
    projectId: '',
    appId: ''
  },
  oldRideHubUrl: 'https://zontes-cameron-ride-2026.matjeri99.chatgpt.site',
  oldChatUrl: 'https://zontes-cameron-ride-2026.matjeri99.chatgpt.site/crew'
};
