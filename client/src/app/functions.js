export const BACKEND = 'http://localhost:5000/'

/***
 E000 END CONSTANTS
 S001 START FUNCTIONS
 ***/

export function api(){
  return fetch(`http://localhost:5000/api/kitty.cat`)
    .then(res=>res.json())
    .then(
      j => {console.log('kitty');j;},
      e => {throw e;console.log('API Echo Failed "reqs/api"');}
    );
}

export function genreq(m,u,b){
  return fetch(BACKEND+u,{
    method:m,
    headers:{"Content-Type":"application/json"},
    body: m === 'POST' ? JSON.stringify(b) : null
  }).then(
    res => res.json(),
    err => {throw generr('Connection Failed: '+url,err);}
  );
}

export function getu(u){
  return fetch(u)
  .then(
    res => res.json(),
    err => {
      console.error(err);
      console.log('Failed GET on '+u);
      throw err;
  });
}

export function postu(u,b){
  return fetch(u,phead(b))
  .then(
    res => res.json(),
    err => {
      console.error(err);
      console.log('Failed POST on '+u);
      throw err;
  });
}

export function getkey(){
  return genreq('GET','getkey',null)
  .then(
    key => processkey(Uint8Array.from(Buffer.from(key,'Base64'))),
    err => {generr('JSON Error: '+BACKEND+'getkey',err);}
  )

/*  let me = 'functions.getkey';

  return getu('http://localhost:5000/getkey')
  .then(
    key => processkey(Uint8Array.from(Buffer.from(key,'base64'))),
    err => {
      console.error(err);
      console.log('Failed to Retrieve Key');
      throw err;
  });
*/
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
/*  .then(
    enc => Buffer.from(new Uint8Array(enc)).toString('base64'),
    err => {
      console.error(err);
      console.log('Failed Encrypting "functions.encrypt"');
      throw err;
  });
*/}

export function login(keyprom){
 // genreq('GET','getkey',null)
  return keyprom.then(
    jso => processkey(Uint8Array.from(Buffer.from(jso,'Base64'))),
    err => {throw fun.generr('JSON Error in functions.login: '+BACKEND+'getkey',err);}
  ).then(
    key => encrypt(key,document.getElementById('ii1').value),
    err => {throw fun.generr('Failed to import public key');}
  ).then(
    enc => fun.genreq('POST','login',{uname:document.getElementById('ii0').value,pass:enc}),
    err => {throw fun.generr('Failed to encrypt in');}
  );/*.then(
    jso => switchpage(SBOSS,PBOSS),
    err => {setstatus(SLOGINF);fun.generr('JSON Error: '+fun.BACKEND+'login',err);}
  );*/
}

/***	
 E001 END FUNCTIONS
 S002 START ERROR FUNCTIONS
 ***/

export function ftcerr(calling,err){
  let E = 'Failed to Connect';
  console.error(err);
  console.log(E+' '+calling);
  return E;
}

export function jsonerr(calling,err){
  let E = 'JSON failed';
  console.error(err);
  console.log(E+' '+calling);
  return E;
}

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
