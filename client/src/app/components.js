import React from 'react';
import styles from "./page.module.css";

export function Wrapper({children,status}){
  return(
    <main key={-1} className={styles.main}>
      <div className={styles.description}>
        <div key={-1} className={styles.whole}>
          <text>{status}</text>
        </div>
        {children}
      </div>
    </main>
  );
}

function Si({key,p,text},id){
  return(
    <div key={key} className={styles.whole}>
      <input type={p?password:text} placeholder={text} id={'si'+id} tabIndex={id+1}/>
    </div>
  );
}

function Ii({key,p,text},id){
  return(
    <div key={text[0]} className={styles.halves}>
      <input key={0} type={p[0]?'password':'text'} placeholder={text[0]} id={'ii'+id    } tabIndex={id+1}/>
      <input key={1} type={p[1]?'password':'text'} placeholder={text[1]} id={'ii'+(id+1)} tabIndex={id+2}/>
    </div>
  );
}

function Bb({key,bc,bl,req},id){
  return(
    <div key={key} className={styles.halves}>
      <button key={0} onClick={bc[0]} req={req[0]} id={'bb'+id    } tabIndex={id+1} >{bl[0]}</button>
      <button key={1} onClick={bc[1]} req={req[1]} id={'bb'+(id+1)} tabIndex={id+2} >{bl[1]}</button>
    </div>
  );
}

function Sb({key,bc,bl,req},id){
  return(
   <div key={key} className={styles.whole}>
     <button onClick={bc} req={req} id={id} tabIndex={id+1}>{bl}</button>
   </div>
  );
}

function Lo({bc,req},id){
  return(
    <div key='logout' className={styles.whole}>
      <button onClick={bc} req={req} id='logoutb' tabIndex={id+1}>Log Out</button>
    </div>
  );
}

export function Page({page,status}){
  var children = page.map((e,i)=>eval(e.type+'(e.props,2*i)'));

  return (
    <Wrapper status={status}>
      {children}
    </Wrapper>
  );
}
