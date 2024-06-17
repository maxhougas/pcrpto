'use client'

import React from "react";
//import Image from "next/image";
import styles from "./page.module.css";

const STATIC_PAS = "PasS";

function bossinterface(){
}

function empinterface(){
}

export default function Home(){

  async function api(){
    try{
      let data = await fetch(`http://localhost:5000/api/kitty.cat`).then((res) => res.json());
      setstatus(data.params);
    }catch(e){
      console.log('O NOES ECHO FAILED!');
      console.error(e);
      setstatus('Api echo failed');
  }}

  async function encrypt(pass){

    let keyr;
    try{
      keyr = await fetch('http://localhost:5000/getkey')
      .then((res) => res.json());
    }catch(e){
      console.log('Failed to retrieve key from backend: "Home/encrypt)');
      console.error(e);
      setstatus('Failed to retrieve key');
    }

//    console.log(keyr);
    let k = Uint8Array.from(Buffer.from(keyr.k,'base64'));
/*    console.log(Buffer.from(keyr.k));
    console.log(Uint8Array.from(Buffer.from(keyr.k)));
*/
    let key;
    try{
      key = await crypto.subtle.importKey(
        'spki',
        k,
        {name:'RSA-OAEP',hash:'SHA-256'},
        true,
        ['encrypt']
      );
    }catch(e){
      console.log('Failed to process key');
      console.error(e);
      setstatus('Failed to process key');
    }

    let encrypted;
    try{
      encrypted = Buffer.from(new Uint8Array(
        await crypto.subtle.encrypt({name:'RSA-OAEP'},key,Buffer.from(STATIC_PAS))
      )).toString('base64');
    }catch(e){
      console.log('Failed to encrypt "Home/encrypt"');
      console.error(e);
      setstatus('Failed to encrypt');
    }

    pass = null; key = null;
    return Promise.resolve(encrypted);
  }

  async function sendLogin(){
    let uname = document.getElementById('unamebox').value;
    let pass = document.getElementById('passbox').value;
    document.getElementById('passbox').value = '';

    let encrypted = '';
    try{
      encrypted = await encrypt(STATIC_PAS);
    }catch(e){
      console.error('Failed to encrypt "home/sendLogin"');
      console.log(e);
      setstatus('Failed to encrypt');
    }
    pass = '';

    console.log('AGAIN:'+encrypted);

    let didlogin = {s:4};
    try {
      didlogin = await fetch('http://localhost:5000/login/',{
        method:'POST',
//        mode:'cors',
//        cache:'no-cache',
//        credentials:'same-origin',
        headers:{"Content-type":"application/json"},
//        redirect:'follow',
//        referrerPolicy:'no-referrer',
        body:JSON.stringify({uname:uname,pass:encrypted})
      }).then((res) => res.json());
    }catch(e){
      console.log('Failed to connect to backend "Home/sendLogin"');
      console.error(e);
      setstatus('Login Failed');
    }

    setstatus(didlogin.s === 0 ? 'Login Accpeted' : 'Login Failed '+didlogin.s);
  }

  function loginBoss(){
    sendLogin();
    bossinterface();
  }

  function loginEmp(){
    sendLogin();
    empinterface();
  }

  const [status,setstatus] = React.useState("Wilkommen");
//  const [key,setkey] = React.useState();

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <div className={styles.whole}>
          {status}
        </div>
        <div className={styles.halves}>
          <input type="text" id="unamebox" placeholder="User Name" />
          <input type="password" id="passbox" placeholder="Password" />
        </div>
        <div className={styles.halves}>
          <button onClick={loginBoss}>Log In Supervisor</button>
          <button onClick={api}>Log In Employee</button>
        </div>
      </div>
    </main>  
  );
}
