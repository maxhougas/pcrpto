import React from 'react';
import styles from "./page.module.css";

export function Wrapper({children,ogrid,status}){
  return(
    <main key={-1} className={styles.main}>
      <div className={styles.description}>
        <div key={-1} style={{gridTemplate: ogrid}} className={styles.output}>
          {status.map(el => <div key={el}>{el}</div>)}
        </div>
        {children}
      </div>
    </main>
  );
}

export function PWrap({children}){
  return(
    <main key={-1} className={styles.main}>
        {children}
    </main>
  );
}

export function Status({grid,status}){
  let s = Array.isArray(status)?status:[status];
  return(
    <div key={0} id='status' style={{gridTemplate: grid}} className={styles.output}>
      {s.map((e,i) => <div key={e} id={'s'+i}>{e}</div>)}
    </div>
  );
}

export function Inputs({grid,isp,itxt,tab}){
  let p = Array.isArray(isp)?isp:[isp];
  let t = Array.isArray(itxt)?itxt:[itxt];
  return(
    <div key={1} id='inputs' style={{gridTemplate: grid}} className={styles.inputs}>
      {t.map((e,i) => <input type={p[i]?'password':'text'} placeholder={e} key={e} id={'i'+i} tabIndex={tab+i}/>)}
    </div>
  );
}

export function Buttons({grid,handler,btxt,tab})
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

export function ConnCheck(status,handler){
  return(
    <PWrap>
      <Status ogrid='1fr / 1fr' status={status}/>
      <Buttons/>
    </PWrap>
  );
}

export function Wilkommen(){
  return(
    <Wrapper ogrid={'1fr'} className={styles.output}>
    </Wrapper>
  );
}

export function Si({key,p,text},id){
  return(
    <div key={key} className={styles.whole}>
      <input type={p?password:text} placeholder={text} id={'si'+id} tabIndex={id+1}/>
    </div>
  );
}

export function Ii({key,p,text},id){
  return(
    <div key={text[0]} className={styles.halves}>
      <input key={0} type={p[0]?'password':'text'} placeholder={text[0]} id={'ii'+id    } tabIndex={id+1}/>
      <input key={1} type={p[1]?'password':'text'} placeholder={text[1]} id={'ii'+(id+1)} tabIndex={id+2}/>
    </div>
  );
}

export function Bb({key,bc,bl},id){
  return(
    <div key={key} className={styles.halves}>
      <button key={0} onClick={bc[0]} id={'bb'+id    } tabIndex={id+1} >{bl[0]}</button>
      <button key={1} onClick={bc[1]} id={'bb'+(id+1)} tabIndex={id+2} >{bl[1]}</button>
    </div>
  );
}

export function Sb({key,bc,bl},id){
  return(
   <div key={key} className={styles.whole}>
     <button onClick={bc} id={id} tabIndex={id+1}>{bl}</button>
   </div>
  );
}

export function Lo({bc,req},id){
  return(
    <div key='logout' className={styles.whole}>
      <button onClick={bc} req={req} id='logoutb' tabIndex={id+1}>Log Out</button>
    </div>
  );
}

export function PPage({page,ogrid,status}){
  return (
    <Wrapper status={status} ogrid={ogrid}>
      {page.map((e,i)=>e.type(e.props,2*i))}
    </Wrapper>
  );
}
