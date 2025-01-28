export const BACKEND = 'http://localhost:5000/'

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

export function login(uname,pass){
  return getkey().then(
    key => encrypt(key,pass),
    err => generr('Failed to Import Key',err)
  ).then(
    enc => genreq('POST','login',{uname:uname,pass:Buffer.from(enc).toString('Base64')}),
    err => generr('Failed to encrypt',err)
  );
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
 S003 START CLASSES
***/

const PHEAD_PROT = {
  method: 'POST',
  headers:{"Content-type":"application/json"},
  body:JSON.stringify({uname:'uname',pass:'pass'})
};

export function phead(b){
  return {
    method:'POST',
    headers:{"Content-type":"application/json"},
    body:JSON.stringify(b)
  }
}
