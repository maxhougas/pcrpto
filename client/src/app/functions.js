export const PORT = 5000;

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

export function miltime(t){
  return t.slice(0,-8).replace('T',' ');
}
export function yurptime(t){
  return t.slice(8,10)+t.slice(4,8)+t.slice(0,4)+' '+t.slice(11,13)+t.slice(13,16);
}
export function tfromd(d){
  return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate()+' '+d.getHours()+' '+d.getMinutes();
}
export function datefromn(n){
  let d = new Date(n);
  return Number(d.getFullYear()+(d.getMonth()+1)+d.getDate());
}
export function yurpdatefromn(n){
  let d = new Date(n);
  return d.getDate()+'-'+(d.getMonth()+1)+'-'+d.getFullYear();
}
export function datefroms(t){
  return s.sclice(0,10).replaceAll(s.charAt(4),'');
}

export function numtime(t){
  return Number(t.slice(0,-8).replace(/[:T-]/g,''));
}

export function tobase64(s){
  return Buffer.from(s).toString('Base64');
}

export function genreq(u,b){
  return fetch('https://'+document.domain+':'+PORT+'/'+u,{
    method:'POST',
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({...b,uname:G.uname})
  }).then(
    res => res.json(),
    err => {throw Error('Connection Failed',{cause:err});}
  ).then(
    jso => {if(jso.err) throw Error('Error from server',{cause:jso.err}); else return jso.d?jso.d:jso;},
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
    (s0 <= s1 && s1 <  e0) ||
    (s0 <  e1 && e1 <= e0) ||
    (s1 <= s0 && s0 <  e1) ||
    (s1 <  e0 && e0 <= e1)
  );
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

export function genshifts(defaults,start){
  const day = 86400000;

  function dow(t){
    let d = new Date(t);
    return d.getDay()==0?0:(d.getDay==6?2:1);
  }

  let out = [];
  for(let i = 0;i<35;i++){
    let dowcode = dow(Number(Date.parse(start))+i*day);
    let sstart = Date.parse(start+'T'+defaults[dowcode  ])+i*day;
    let sc     = Date.parse(start+'T'+defaults[dowcode+3])+i*day;
    let send   = Date.parse(start+'T'+defaults[dowcode+6])+i*day;
    sc   += sstart < sc   ? 0 : day;
    send += sstart < send ? 0 : day;

    out = out.concat([[sstart,sc,send]]);
  }

  return out;
}

export function shiftconfs(shifts,ptos){
  let conflicts = [];

  shifts.forEach(shift => {
    let shift0nos = [];
    let shift1nos = [];

    ptos.forEach(pto => {
      if (doesconflict(Date.parse(pto.startdate.slice(0,16)),shift[0],Date.parse(pto.enddate.slice(0,16)),shift[1]))
        shift0nos = shift0nos.concat([pto.emp]);
      if (doesconflict(Date.parse(pto.startdate.slice(0,16)),shift[1],Date.parse(pto.enddate.slice(0,16)),shift[2]))
        shift1nos = shift1nos.concat([pto.emp]);
    })

    conflicts = conflicts.concat([{Date:yurpdatefromn(shift[0]),shift0:shift0nos,shift1:shift1nos}]);
  });

  return conflicts;
}

/***	
 E001 END FUNCTIONS
 ***/
