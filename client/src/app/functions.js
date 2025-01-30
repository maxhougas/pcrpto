export const MIP = process.env.MIP || '172.17.0.2';
export const NIP = process.env.NIP || 'localhost';
export const PORT = process.env.PORT || 5000;
export const BACKEND = 'http://'+NIP+':'+PORT+'/';

/***
 E000 END CONSTANTS
 S001 START FUNCTIONS
 ***/

export function api(){
  return fetch(`http://localhost:5000/api/kitty.cat`).then(
    res => res.json()
  ).then(
    jso => {console.log('kitty');jso;},
    err => {throw err;console.log('API Echo Failed "reqs/api"');console.error(err);}
  );
}

export function testpair(){
  fetch('http://localhost:5000/pair')
}

export function gcols(n){
  return 'repeat('+n+',1fr)';
}

export function stretch(g,n,i){
  return i>=Math.floor(n/g)*g?'1 / '+(g+1):'auto';
}

export function fixtime(t){
  return (t.slice(0,-7).replace(/[:-]/g,'').replace('T',' '));
}

export function tobase64(s){
  return Buffer.from(s).toString('Base64');
}

export function genreq(m,u,b){
  return fetch(BACKEND+u,{
    method:m,
    headers:{"Content-Type":"application/json"},
    body: m === 'POST' ? JSON.stringify(b) : null
  }).then(
    res => res.json(),
    err => {throw generr('Connection Failed: '+u,err);}
  );
}

export function getkey(){
  return genreq('GET','getkey',null).then(
    key => processkey(Uint8Array.from(Buffer.from(key,'Base64'))),
    err => generr('JSON Error: '+BACKEND+'getkey',err)
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
  return crypto.subtle.encrypt({name:'RSA-OAEP'},k,Buffer.from(pass))
}

export function checkconflicts(requests){
  let s = requests.map(el => Number(fixtime(el.startdate).replace(' ','')));
  let e = requests.map(el => Number(fixtime(el.enddate).replace(' ','')));
  let c = [];

  for(let i=0; i<s.length; i++)
    for(let j=i+1; j<s.length; j++)
      if(
        (s[i] < s[j] && s[j] < e[i]) ||
        (s[i] < e[j] && e[j] < e[i]) ||
        (s[j] < s[i] && s[i] < e[i]) ||
        (s[j] < e[i] && e[i] < e[j]) ||
        (s[i] == s[j] && e[i] == e[j])
      ) c = c.concat(''+(i+1)+' & '+(j+1));
  return c;
}

/***	
 E001 END FUNCTIONS
 S002 START ERROR FUNCTIONS
 ***/

export function generr(m,err){
  console.log(m);
  console.error(err);
  return err;
}

/***
 E002 END ERROR FUNCTIONS
***/
