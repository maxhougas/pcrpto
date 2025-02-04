export const PORT = 5000;

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

export function miltime(t){
  return t.slice(0,-8).replace('T',' ');
}

export function yurptime(t){
  return t.slice(8,10)+t.slice(4,8)+t.slice(0,4)+' '+t.slice(11,13)+t.slice(13,16);
}

export function numtime(t){
  return Number(t.slice(0,-8).replace(/[:T-]/g,''));
}

export function tobase64(s){
  return Buffer.from(s).toString('Base64');
}

export function genreq(m,u,b){
  return fetch('https://'+document.domain+':'+PORT+'/'+u,{
    method:m,
    headers:{"Content-Type":"application/json"},
    body: m === 'POST' ? JSON.stringify(b) : null
  }).then(
    res => res.json(),
    err => {throw Error('Connection Failed',{cause:err});}
  ).then(
    jso => {if(jso.err) throw Error('Error from server',{cause:jso.err}); else  return jso.d?jso.d:jso;},
    err => {throw Error('JSON parse failed',{cause:err});}
  );
}

export function getkey(){
  return genreq('GET','getkey',null).then(
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

/***	
 E001 END FUNCTIONS
 ***/
