'use client'

import React from "react";
import Image from "next/image";
import styles from "./page.module.css";
import * as comps from "./components.js"
import * as reqs from "./reqs.js";

const STATIC_PAS = "PasS";

function bossinterface(){
}

function empinterface(){
}

export default function Home(){

  function loginboss(){
    reqs.sendlogin(
      document.getElementById('unamebox').value,
      document.getElementById('passbox').value
    );
    //bossinterface();
  }

  function loginEmp(e){
    sendLogin();
    empinterface();
  }

  const [status,setstatus] = React.useState("Wilkommen");

  const LOGIN_PAGE = (
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
          <button onClick={loginboss}>Log In Supervisor</button>
          <button onClick={()=>setstatus(reqs.api())}>Log In Employee</button>
        </div>
      </div>
    </main>
  );

  const [page,setpage] = React.useState(LOGIN_PAGE);

  return (comps.Login(status,loginboss,loginboss));
}
