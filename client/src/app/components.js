import React from 'react';
import styles from "./page.module.css";

function Wrapper({children,status}){
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

export function Si({key,p,text},id){
  return(
    <div key={key} className={styles.whole}>
      <input type={p?password:text} placeholder={text} id={'si'+id} tabIndex={id}/>
    </div>
  );
}

export function Ii({key,p,text},id){
  return(
    <div key={text[0]} className={styles.halves}>
      <input key={0} type={p[0]?'password':'text'} placeholder={text[0]} id={'ii'+id    } tabIndex={id  }/>
      <input key={1} type={p[1]?'password':'text'} placeholder={text[1]} id={'ii'+(id+1)} tabIndex={id+1}/>
    </div>
  );
}

export function Bb({key,bc,bl},id){
  return(
    <div key={key} className={styles.halves}>
      <button key={0} onClick={bc[0]} id={'bb'+id    } tabIndex={id  } >{bl[0]}</button>
      <button key={1} onClick={bc[1]} id={'bb'+(id+1)} tabIndex={id+1} >{bl[1]}</button>
    </div>
  );
}

export function Sb({key,bc,bl},id){
  return(
   <div key={key} className={styles.whole}>
     <button onClick={bc} id={id} tabIndex={id}>{bl}</button>
   </div>
  );
}

export function Page({page,status}){
  var children = page.map((e,i)=>e.type(e.props,2*i));

  return (
    <Wrapper status={status}>
      {children}
    </Wrapper>
  );
}
