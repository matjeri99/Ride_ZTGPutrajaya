/** ZONTES PUBLIC READ-ONLY FEED — Google Apps Script for a PRIVATE spreadsheet.
 *  Deploy as a Web App: Execute as ME, access Anyone. This intentionally publishes
 *  ONLY the non-sensitive fields below. This script does not provide any write API.
 *  DO NOT add email addresses, phone numbers, access tokens or private notes here.
 *  Uses validated JSONP callback for Github Pages cross-origin compatibility.
 */
const TABS = {participants:'Participants',rides:'Rides',itinerary:'Itinerary'};
function doGet(e) {
  const callback = String((e && e.parameter && e.parameter.callback) || '');
  if(callback && !/^[A-Za-z_$][A-Za-z0-9_$]{0,79}$/.test(callback)) return ContentService.createTextOutput('Invalid callback');
  const doc=SpreadsheetApp.getActiveSpreadsheet();
  const read=(name)=>{
    const sheet=doc.getSheetByName(name);
    if(!sheet)throw new Error('Missing sheet: '+name);
    return sheet.getDataRange().getDisplayValues().slice(1).filter(row=>row[0]);
  };
  const data={
    generatedAt:new Date().toISOString(),
    rides:read('Rides').map(x=>({id:x[0],name:x[1],start:x[2],end:x[3],hotel:x[4],route:x[5],gallery:x[6],status:x[7]})),
    participants:read('Participants').map(x=>({rideId:x[0],seq:Number(x[1])||0,rider:x[2],pillion:x[3],pax:Number(x[4])||1,status:x[5]})),
    itinerary:read('Itinerary').map(x=>({rideId:x[0],day:x[1],time:x[2],location:x[3],note:x[4]}))
  };
  const json=JSON.stringify(data).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  if(callback) return ContentService.createTextOutput(callback+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e){return ContentService.createTextOutput('Read-only endpoint').setMimeType(ContentService.MimeType.TEXT);}
