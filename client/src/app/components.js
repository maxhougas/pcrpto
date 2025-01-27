import React from 'react';
import styles from "./page.module.css";

function PWrap({children}){
  return(
    <main key={-1} className={styles.main}>
        {children}
    </main>
  );
}

function Status({grid,status}){
  let s = Array.isArray(status)?status:[status];
  return(
    <div key={0} id='status' style={{gridTemplate: grid}} className={styles.output}>
      {s.map((e,i) => <div key={e} id={'s'+i}>{e}</div>)}
    </div>
  );
}

function Inputs({grid,isp,itxt,tab}){
  let p = Array.isArray(isp)?isp:[isp];
  let t = Array.isArray(itxt)?itxt:[itxt];
  return(
    <div key={1} id='inputs' style={{gridTemplate: grid}} className={styles.inputs}>
      {t.map((e,i) => <input type={p[i]?'password':'text'} placeholder={e} key={e} id={'i'+i} tabIndex={tab+i}/>)}
    </div>
  );
}

function Buttons({grid,handler,btxt,tab})
{
  let h = Array.isArray(handler)?handler:[handler];
  let t = Array.isArray(btxt)?btxt:[btxt];
  return(
    <div key={2} id='buttons' style={{gridTemplate: grid}} className={styles.buttons}>
      {t.map((e,i) => <button onClick={h[i]} key={e} id={'b'+i} tabIndex={tab+i}>{e}</button>)}
    </div>
  );
}

export function Page({sprops,iprops,bprops}){
  return(
    <PWrap>
      {sprops?<Status  {...sprops}/>:null}
      {iprops?<Inputs  {...iprops} tab={1}/>:''}
      {bprops?<Buttons {...bprops} tab={iprops?(Array.isArray(iprops.itxt)?iprops.itxt.length:2):1}/>:null}
    </PWrap>
  );
}
