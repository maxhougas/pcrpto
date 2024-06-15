'use client'

import React from "react";
import Image from "next/image";
import styles from "./page.module.css";
import crypto from "crypto";

function bossinterface(){
}

function empinterface(){
}

export default function Home(){

  function encrypt(pass){
    let key;

    try{
      fetch('http://localhost:5000/getkey')
        .then((res) => res.json())
        .then((data) => {console.log(data);key=data.key;});
    } catch(e){
      console.log('Failed to retrieve key from backend: "Home/encrypt)');
      console.log(e);
      setstatus('Failed to retrieve key');
    }
    console.log(key);
    let encrypted;

    try{
      encrypted = crypto.publicEncrypt({key:key},pass);
    }
    catch(e){
      console.log('Failed to encrypt "Home/encrypt"');
      console.error(e);
      setstatus('Failed to encrypt');
    }

    return encrypted;
  }

  function sendLogin(){
    let uname = document.getElementById('unamebox').value;
    let pass = document.getElementById('passbox').value;
    document.getElementById('passbox').value = '';

    let encrypted;

    try{
       encrypted = encrypt(pass);
    } catch(e){
      console.log('Failed to encrypt "home/sendLogin"');
      console.log(e);
      setstatus('Failed to encrypt');
    }

    pass = '';

    try {
      fetch(`http://localhost:5000/login/${uname}.${encrypted}`)
        .then((res) => res.json())
        .then((data) => setstatus( data.message === 0 ? 'Login Accpeted' : 'Login Failed '+data.message));
    } catch(e){
      console.log('Failed to connect to backend "Home/sendLogin"');
      console.log(e);
      setstatus('Login Failed');
    }
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
          <button onClick={loginEmp}>Log In Employee</button>
        </div>
      </div>
    </main>  
  );
}
