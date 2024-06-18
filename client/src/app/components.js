import React from 'react';
import styles from "./page.module.css";

function Wrapper({children}){
  return(
    <main className={styles.main}>
      <div className={styles.description}>
        {children}
      </div>
    </main>
  );
}

export function Login(status,supbutton,empbutton){
  return(
    <Wrapper>
      <div className={styles.whole}>
        {status}
      </div>
      <div className={styles.halves}>
        <input type="text" id="unamebox" placeholder="User Name" />
        <input type="password" id="passbox" placeholder="Password" />
      </div>
      <div className={styles.halves}>
        <button onClick={supbutton}>Log In Supervisor</button>
        <button onClick={empbutton}>Log In Employee</button>
      </div>
    </Wrapper>
  );
}

export function Loginpage(status,f1,f2){
  return(
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
          <button onClick={f1}>Log In Supervisor</button>
          <button onClick={f2}>Log In Employee</button>
        </div>
      </div>
    </main>
  );
}

export function Hi(){
  return (<></>);
}
