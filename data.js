export const snapshot = {
  generatedAt: '2026-10-26',
  rides: [{id:'CAM2026',name:'Cameron Highlands Ride 2026',start:'2026-10-31',end:'2026-11-01',hotel:'7 Days Premium Hotel, Brinchang',route:'Putrajaya → Rawang → Simpang Pulai → Brinchang → Tapah',gallery:'https://photos.app.goo.gl/ZKuh2uRxibVXTV8r9',status:'Upcoming'}],
  participants: [
    ['Pseudo','Pillion',2],['Nas','Pillion + Jr',3],['Wan Japan','Tiada',1],['Bob','Tiada',1],['Abg Z','BigBos',2],['Obie','Tiada',1],['Myus98','Tiada',1],['Yeob','Pillion',2],['Panjang','Pillion',2],['Ejad','Tiada',1],['Azuan','Tiada',1],['Zaidi','Tiada',1],['Joi','Son',2],['Asrie','Pillion',2],['Kamil','Pillion',2],['Ucop','Tiada',1]
  ].map(([rider,pillion,pax],i)=>({rideId:'CAM2026',seq:i+1,rider,pillion,pax,status:'Confirmed'})),
  itinerary: [
    ['31 Okt','06:00','R&R Rawang (Utara)','Solat Subuh; coffee break. Bergerak 06:20.'],
    ['31 Okt','08:00','Gopeng / Simpang Pulai','Sarapan Warong Do Reigh Mi, Hobbitoons, Avant Choc.'],
    ['31 Okt','11:30','BOH Sungai Palas','Minum teh, scones dan fotografi.'],
    ['31 Okt','13:00','Kea Farm','Sheep Sanctuary, makan tengah hari, Raju’s Strawberry Farm.'],
    ['31 Okt','15:00','7 Days Premium Hotel','Check-in dan rehat.'],
    ['31 Okt','18:00','Charcoal Steamboat','Makan malam.'],
    ['31 Okt','20:00','Cafe & Pasar Malam','Cado Cafe / Rasa Soya / Golden Hills Night Market.'],
    ['1 Nov','09:30','Tokyo Town Cameron','Sesi bergambar dan cafe.'],
    ['1 Nov','11:30','7 Days Premium Hotel','Check-out dan kemas barang.'],
    ['1 Nov','12:30','Bharat Tea Plantation','Minum teh dan santai.'],
    ['1 Nov','13:30','Turun melalui Tapah','Masa bertindih dengan Bharat sehingga 14:00 — perlu pengesahan Kapten.']
  ].map(([day,time,location,note])=>({rideId:'CAM2026',day,time,location,note}))
};
