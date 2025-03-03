import React from 'react';
import styles from "./page.module.css";
import {gcols,stretch} from "./functions.js";

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
    <div key={0} id='status' style={{gridTemplateColumns: gcols(grid)}} className={styles.status}>
      {s.map((e,i) => <div style={{gridColumn: stretch(grid,s.length,i)}} key={i} id={'s'+i}>{e}</div>)}
    </div>
  );
}

function Outputs({grid,outputs}){
  let o = Array.isArray(outputs)?outputs:[outputs];

  return(
    <div key={1} id='outputs' style={{gridTemplateColumns: gcols(grid)}} className={styles.outputs}>
      {o.map((e,i) => <div style={{gridColumn: stretch(grid,o.length,i)}} key={i} id={'o'+i}>{e}</div>)}
    </div>
  );
}

function Inputs({grid,type,itxt,tab}){
  let y = Array.isArray(type)?type:[type];
  let t = Array.isArray(itxt)?itxt:[itxt];

  return(
    <div key={1} id='inputs' style={{gridTemplateColumns: gcols(grid)}} className={styles.inputs}>
      {t.map((e,i) => <input style={{gridColumn: stretch(grid,t.length,i)}} type={y[i]} placeholder={e} key={e} id={'i'+i} tabIndex={tab+i}/>)}
    </div>
  );
}

function Buttons({grid,handler,btxt,tab})
{
  let h = Array.isArray(handler)?handler:[handler];
  let t = Array.isArray(btxt)?btxt:[btxt];

  return(
    <div key={2} id='buttons' style={{gridTemplateColumns: gcols(grid)}} className={styles.buttons}>
      {t.map((e,i) => <button style={{gridColumn: stretch(grid,t.length,i)}} onClick={h[i]} key={e} id={'b'+i} tabIndex={tab+i}>{e}</button>)}
    </div>
  );
}

export function Ynemplist({ja,nein}){
  return(
    <>
      <ul style={{margin:0,padding:'0 5px 0 0',listStyleType:'none'}} key={'ja'}>
        {['*JA*'].concat(ja).map((e,i)=><li key={i}>{e}</li>)}
      </ul>
      <ul style={{margin:0,padding:'0 0 0 5px',listStyleType:'none'}} key={'nein'}>
        {['*NEIN*'].concat(nein).map((e,i)=><li key={i}>{e}</li>)}
      </ul>
    </>
  );
}

export function Page({sprops,oprops,iprops,bprops}){
  return(
    <PWrap>
      {sprops?<Status  {...sprops}/>:''}
      {oprops?<Outputs {...oprops}/>:''}
      {iprops?<Inputs  {...iprops} tab={1}/>:''}
      {bprops?<Buttons {...bprops} tab={iprops?(Array.isArray(iprops.itxt)?iprops.itxt.length:2):1}/>:''}
    </PWrap>
  );
}
