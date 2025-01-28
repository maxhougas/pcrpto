'use client'

import React from "react";
import Image from "next/image";
import styles from "./page.module.css";
import * as comps from "./components.js"
import * as fun from "./functions.js";

export default function Home(){

  const [sprops,setsprops] = React.useState({grid:'1fr',status:['Start']});
  const [iprops,setiprops] = React.useState(null);
  const [bprops,setbprops] = React.useState({grid:'1fr',handler:[cback],btxt:['Check Connection']})

/***
 S001 START HELPER FUNCTIONS
 ***/

  function testpair(){
    fetch('http://localhost:5000/pair')
  }

  function s(grid,status){
    return ({grid:grid,status:status});
  }
  function i(grid,type,itxt){
    return({grid:grid,type:type,itxt:itxt});
  }
  function b(grid,handler,btxt){
    return({grid:grid,handler:handler,btxt:btxt});
  }

  function loginpage()
  {
    setsprops({grid:1,status:['Willkommen']});
    setiprops({grid:2,type:['text','password'],itxt:['Username','Password']});
    setbprops({grid:2,handler:[loginemp,loginboss],btxt:['Employee Log In','Admin Log In']});
  }

/***
 E001 END HELPER FUNCTIONS
 S002 START BUTTON FUNCTIONS
 ***/

  function cback(){
    setsprops(s(1,'Checking...'));
    fun.genreq('POST','echo',{echo:'echo'}).then(
      jso=> loginpage(),
      err=>{
        setsprops(s(1,'Back End Not Found'));
        fun.generr('JSON Error: '+fun.BACKEND+'echo',err);
    })
  }

  function logout(){
    setsprops(s(1,['Logging Out...']));

    fun.genreq('GET','logout',null).then(
      jso => loginpage(),
      err => {
        setsprops(s(1,['Logout Failed']));
        fun.generr('JSON Error: '+fun.BACKEND+'logout',err);
      }
    );
  }

  function loginboss(){
    setsprops(s(1,['Logging In...']));

    fun.login(document.getElementById('i0').value,document.getElementById('i1').value).then(
      jso => {
        if(jso.mode === 'admin') {
          setsprops(s(1,['Admin Mode']));
          setiprops(i(1,['text'],['Ausweis']));
          setbprops(b(3,
            [lemp,            cuser,        duser,        vreqs,          rpreq,           
             preqs,           conflicts,    cpass,          termconns,              logout],
            ['List Employees','Create User','Delete User','View Requests','Remove Request',
             'Purge Requests','Conflicts','Change Password','Terminate Connections','Log Out']
          ));
        }else{
          fun.genreq('GET','logout',null).then(
            jso => setsprops(s(1,['User Is not an Admin'])),
            err => {
             setsprops(s(1,['Log Out Failed']));
             fun.generr('JSON Error: '+fun.BACKEND+'logout',err);
        });}
      },err => {
        setsprops(s(1,['Login Failed']));
        fun.generr('JSON Error: '+fun.BACKEND+'login',err);
     });
  }  

  function conflicts(){
  }

  function lemp(){
    let url = 'lemp';
    setsprops(s(1,['Retrieving Data...']));

    function mklist(usrs){
      return usrs.map(e => e.User);
    }

    fun.genreq('GET',url,null).then(
      jso => setsprops(s(2,mklist(jso[0]))),
      err => {
        setsprops(s(1,['Get Users Failed']));
        fun.generr('JSON Error: '+fun.BACKEND+url,err);
    });
  }

  function preqs(){
    let url = 'preqs'
    let conf = document.getElementById('i0').value

    if(conf !== 'PURGE')
      setsprops(s(1,['Type "PURGE" and press button again']));
    else{
      setsprops(s(1,['Purging...']));
      genreq('POST',url,{checkphrase:conf}).then(
        jso => setsprops(s(1,['Requests Purged'])),
        err => fun.generr('JSON Error: '+fun.BACKEND+url,err)
      );
    }
  }

  function rpreq(){
    let id = document.getElementById('inputs').children.item(document.getElementById('inputs').children.length - 1).value;

    if(id){
      let url = 'rpreq'
      setsprops(s(1,['Deleting...']));

      fun.genreq('POST',url,{id:id}).then(
        jso => setsprops(s(1,['Request Deleted'])),
        err => {
         setsprops(s(1,['Delete Failed']));
         fun.generr('JSON Error: '+fun.BACKEND+url,err);
    });}else
     setsprops(s(1,['Failed: Empty String']));
  }

  function cpass(){
  }

  function cuser(){
    if(document.getElementById('i0').value === '')
      setsprops(s(1,['Failed: Empty String']));
    else{
      let url = 'cuser';
      setsprops(s(1,['Creating User...']));

      fun.genreq('POST',url,{nuname:document.getElementById('i0').value}).then(
        jso => setsprops(s(1,['User Created'])),
        err => {
          setsprops(s(1,['Create User Failed']));
          fun.generr('JSON Error '+fun.BACKEND+url,err);
    });}
  }

  function duser(){
    if(document.getElementById('i0').value === 'ptoboss'){
      setsprops(s(1,['DUMME IDEE!']));
      console.error('Attempted to delete admin');
    }else{
      let url = 'duser';
      setsprops(s(1,'Deleting User...'));
      fun.genreq('POST',url,{uname:document.getElementById('i0').value}).then(
        jso => setsprops(s(1,['User Deleted'])),
        err => {
          setsprops(s(1,['Delete User Failed']));
          fun.generr('JSON Error: '+fun.BACKEND+url,err);
    })}
  }

  function termconns(){
    let url='reset';
    setsprops(s(1,['Terminating...']));

    fun.genreq('POST',url,{checkphrase:'reset'}).then(
      jso => loginpage(),
      err => {
        setsprops(s(1,['Reset Failed']));
        fun.generr('JSON Error: '+fun.BACKEND+url,err);
    });
  }

  function vreqs(){
    let url = 'vreqs';
    setsprops(s(1,['Getting Requests...']));

    function mklist(jso){
      let lst = ['Request ID','Employee ID','Start','End'];
      jso.forEach(e => lst = lst.concat([e.id,e.empid,fun.fixtime(e.startdate),fun.fixtime(e.enddate)]));
      return(lst);
    }

    fun.genreq('GET',url,).then(
      jso => setsprops(s(4,mklist(jso[0]))),
      err => {
        setsprops(s(1,['Get Requests Failed']));
        fun.generr('JSON Error '+fun.BACKEND+url,err);
    });
  }

  function loginemp(){
    setsprops(s(1,['Logging In...']));

    fun.login(document.getElementById('i0').value,document.getElementById('i1').value).then(
      jso => {
        if(jso.mode === 'employee'){
          setsprops(s(1,['Employee Mode']));
          setiprops(i(2,['datetime-local','datetime-local','number'],['Start:YYYYMMDDHHMMSS','End:YYYYMMDDHHMMSS','Request ID']));
          setbprops(b(2,
            [spreq,           rpreq,           vreqs,          cpass,            logout],
            ['Submit Request','Revoke Request','View Requests','Change Password','Log Out']
          ));
        }else{
          fun.genreq('GET','logout',null).then(
            jso => setsprops(s(1,['User Is not an Employee'])),
            err => {
             setsprops(s(1,['Log Out Failed']));
             fun.generr('JSON Error: '+fun.BACKEND+'logout',err);
        });}
      },err => {
        setsprops(s(1,['Login Failed']));
        fun.generr('JSON Error: '+fun.BACKEND+'login',err);
    });
  }

  function spreq(){
    let start = document.getElementById('i0').value
    let end = document.getElementById('i1').value

    if((start) && (end)){
      let url = 'spreq'
      setsprops(s(1,['Submitting...']));

      fun.genreq('POST',url,{start:start,end:end}).then(
        jso => setsprops(s(1,['Request Submitted'])),
        err => {
         setsprops(s(1,['Request Submission Failed']));
         fun.generr('JSON Error: '+fun.BACKEND+url,err);
    });}else
     setsprops(s(1,['Failed: Empty String']));
  }

/***
 E002 END BUTTON FUNCTIONS
 ***/
  
  return (<comps.Page sprops={sprops} iprops={iprops} bprops={bprops}/>);
}
