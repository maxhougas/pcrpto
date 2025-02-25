export const PRODUCTION = 0;
export const NPORT = 5000;
export const DAY = 86400000;
export const HOUR = 3600000;
export const MINUTE = 60000;
export const ZONE = (new Date()).getTimezoneOffset()*60000;

export const G = {
  pkey:'',
  uname:'',
  tok:''
}

/***
 E000 END CONSTANTS
 S001 START FUNCTIONS
 ***/

export function gcols(n){
  return 'repeat('+n+',1fr)';
}

export function stretch(g,n,i){
  return i>=Math.floor(n/g)*g?'1 / '+(g+1):'auto';
}

export function stripsec(t){
  return t.slice(0,16);
}

export function ms(t){
  return Date.parse('1970-01-01 '+t+'Z');
}
/*export function localtime(t){
  return (t.slice(0,16).replace('T',' '));
}
*/
export function yurptime(t){
  return t.slice(8,10)+t.slice(4,8)+t.slice(0,4)+' '+t.slice(11,13)+t.slice(13,16);
}
/*export function tfromd(d){
  return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()+' '+d.getHours()+' '+d.getMinutes();
}
*/
/*export function datefromn(n){
  let d = new Date(n);
  return ''+d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
}
*/
export function yurpdatefromn(n){
  let d = new Date(n);
  return d.getDate()+'-'+(d.getMonth()+1)+'-'+d.getFullYear();
}
/*export function datefroms(t){
  return s.sclice(0,10).replaceAll(s.charAt(4),'');
}
*/
/*export function numtime(t){
  return Number(t.slice(0,-8).replace(/[:T-]/g,''));
}
*/

export function tobase64(s){
  return Buffer.from(s).toString('Base64');
}

export function txtbox(id){
  return document.getElementById(id).value;
}

export function genreq(u,b){
  return fetch((PRODUCTION?document.URL:'https://'+document.domain+':'+NPORT+'/')+u,{
    method:'POST',
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({...b,uname:G.uname,tok:G.tok})
  }).then(
    res => res.json(),
    err => {throw Error('Connection Failed',{cause:err});}
  ).then(
    jso => {if(jso.err) throw Error('Error from server',{cause:jso.err}); else {if(jso.t) G.tok = jso.t; return jso.d?jso.d:jso;}},
    err => {throw Error('JSON parse failed',{cause:err});}
  );
}

export function getkey(){
  return genreq('getkey',null).then(
    key => processkey(Uint8Array.from(Buffer.from(key,'Base64'))),
    err => {throw Error('Key request failed',{cause:err});}
  );
}

export function processkey(k){
  return crypto.subtle.importKey(
    'spki',
    k,
    {name:'RSA-OAEP',hash:'SHA-256'},
    true,
    ['encrypt']
  );
}

export function encrypt(k,pass){
  return crypto.subtle.encrypt({name:'RSA-OAEP'},k,Buffer.from(pass));
}

export function doesconflict(s0,s1,e0,e1){
  return(
    e0-s0 > 0 && e1-s1 > 0 && ( 
    (s0 <= s1 && s1 <  e0) ||
    (s0 <  e1 && e1 <= e0) ||
    (s1 <= s0 && s0 <  e1) ||
    (s1 <  e0 && e0 <= e1)
  ));
}

export function checkconflicts(requests){
  let s = requests.map(el => Date.parse(el.startdate));
  let e = requests.map(el => Date.parse(el.enddate));
  let c = [];

  for(let i=0; i<s.length; i++)
    for(let j=i+1; j<s.length; j++)
      if(doesconflict(s[i],s[j],e[i],e[j]))
        c = c.concat(''+requests[i].id+' & '+requests[j].id);
  return c;
}

export function genshifts(start,defaults,specials = null){
  let defs = Array(7);

  for(let i = 4;i < 11;i++)
    defs[i-4] = [
       ms(defaults[Math.floor(i/5)]),
      (ms(defaults[Math.floor(i/5)]) > ms(defaults[Math.floor(i/5)+3])) ? ms(defaults[Math.floor(i/5)+3]) + DAY : (ms(defaults[Math.floor(i/5)+3])),
      (ms(defaults[Math.floor(i/5)]) > ms(defaults[Math.floor(i/5)+6])) ? ms(defaults[Math.floor(i/5)+6]) + DAY : (ms(defaults[Math.floor(i/5)+6])),
    ];

  let out = Array(35);
  for(let i = 0;i < 35;i++){
    let unix = Date.parse(start+i*DAY);
    let dow = (new Date(unix)).getDay()
    out[i] = [
      unix+defs[dow][0],
      unix+defs[dow][1],
      unix+defs[dow][2],
    ]; 
  }

  specials.forEach(special => {
    let i = Math.floor((Date.parse(special.date) - Date.parse(start))/DAY);
    if(i >= 0 && i < 35){
      out[i][0] = Date.parse(special.date) +  ms(special.start);
      out[i][1] = Date.parse(special.date) + (ms(special.start) > ms(special.sc ) ? ms(special.sc ) + DAY : (ms(special.sc )));
      out[i][2] = Date.parse(special.date) + (ms(special.start) > ms(special.end) ? ms(special.end) + DAY : (ms(special.end)));
    }
  });

  return out;
}

export function shiftconfs(shifts,ptos){
  let conflicts = [];

  shifts.forEach(shift => {
    let shift0nos = [];
    let shift1nos = [];

    ptos.forEach(pto => {
      if (doesconflict(Date.parse(pto.startdate),shift[0],Date.parse(pto.enddate),shift[1]))
        shift0nos = shift0nos.concat([pto.emp]);
      if (doesconflict(Date.parse(pto.startdate),shift[1],Date.parse(pto.enddate),shift[2]))
        shift1nos = shift1nos.concat([pto.emp]);
    })

    conflicts = conflicts.concat([{date:yurpdatefromn(shift[0]),shift0:shift0nos,shift1:shift1nos}]);
  });

  conflicts = conflicts.filter(e => e.shift0.toString() || e.shift1.toString());
  return conflicts;
}

/***	
 E001 END FUNCTIONS
 ***/
