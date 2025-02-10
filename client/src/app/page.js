'use client'

import React from "react";
import Image from "next/image";
import styles from "./page.module.css";
import * as comps from "./components.js"
import * as fun from "./functions.js";

export default function Home(){

  const [sprops,setsprops] = React.useState({grid:1,status:['Willkommen']});
  const [oprops,setoprops] = React.useState(null);
  const [iprops,setiprops] = React.useState({grid:2,type:['text','password'],itxt:['Username','Password']});
  const [bprops,setbprops] = React.useState({grid:1,handler:[login],btxt:['Log In']});

/***
 S001 START HELPER FUNCTIONS
 ***/

  function closeHandle(e){
    e.preventDefault();
    logout();
  }

  function s(grid,status){
    return ({grid:grid,status:status});
  }
  function o(grid,outputs){
    return ({grid:grid,outputs:outputs});
  }
  function i(grid,type,itxt){
    return({grid:grid,type:type,itxt:itxt});
  }
  function b(grid,handler,btxt){
    return({grid:grid,handler:handler,btxt:btxt});
  }

  function loginpage(){
    setsprops({grid:1,status:['Willkommen']});
    setoprops(null);
    setiprops({grid:2,type:['text','password'],itxt:['Username','Password']});
    setbprops({grid:1,handler:[login],btxt:['Log In']});
  }

  function bossmode(){
   setsprops({grid:1,status:['Admin Mode']});
   setoprops(null);
   setiprops({grid:1,type:['text'],itxt:['Ausweis']});
   setbprops({
     grid:3,
     handler:[ lemp,            cuser,        duser,        vreqs,          rpreq,
               preqs,           conflicts,  cpasspage,        mplan,       termconns,              logout],
     btxt:   ['List Employees','Create User','Delete User','View Requests','Remove Request',
              'Purge Requests','Conflicts','Change Password','Month Plan','Terminate Connections','Log Out']
   });
  }

  function employeemode(){
    setsprops({grid:1,status:['Employee Mode']});
    setoprops(null);
    setiprops({
      grid:2,
      type:['datetime-local',      'datetime-local',    'number'],
      itxt:['Start:YYYYMMDDHHMMSS','End:YYYYMMDDHHMMSS','Request ID']
    });
    setbprops({
      grid:2,
      handler:[ spreq,           rpreq,           vreqs,          cpasspage,        logout],
      btxt:   ['Submit Request','Revoke Request','View Requests','Change Password','Log Out']
    });
  }

  function cpasspage(){
    setsprops({grid:1,status:['Change Password']});
    setoprops(null);
    setiprops({grid:2,type:['text','password','password','password'],itxt:['Username','Old Password','New Password','Confirm Password']});
    setbprops({grid:2,handler:[cpass,mainpage,logout],btxt:['Confirm','Back','Log Out']});
  }

  function rsuc(status = null,ogrid = null,oarr = null){
    setsprops(status?s(1,Array.isArray(status)?status:[status]):null);
    setoprops((ogrid && oarr && oarr.toString())?o(ogrid,oarr):null);
  }
  function rfail(err){
     setsprops(s(1,err.message));
     setoprops(null);
     console.error(err);
  }

/***
 E001 END HELPER FUNCTIONS
 S002 START BUTTON FUNCTIONS
 ***/

  function login(){
    let url = 'login';
    let errmsg = 'Login Failed';
    fun.G.uname = document.getElementById('i0').value;
    let pass = document.getElementById('i1').value;
    document.getElementById('i1').value = '';
    setsprops(s(1,['Logging In...']));

    fun.getkey().then(
      key => {fun.G.pkey = key; return fun.encrypt(key,pass);},
      err => {throw Error('Get key failed',{cause:err});}
    ).then(
      enc => fun.genreq(url,{pass:fun.tobase64(enc)}),
      err => {throw Error('Encryption failed',{cause:err});}
    ).then(
      jso => {window.addEventListener('beforeunload',closeHandle,false);mainpage();},
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function logout(){
    let url = 'logout';
    let errmsg = 'Logout Failed';
    setsprops(s(1,['Logging Out...']));

   fun.genreq(url,null).then(
      jso => {window.removeEventListener('beforeunload',closeHandle,false);loginpage();},
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function mainpage(){
    let url = 'whoami';
    let errmsg = 'Determine User Mode Failed'
    setsprops(s(1,['Who Am I?']));

    fun.genreq(url,null).then(
      jso => {if (jso.mode === 'admin') bossmode(); else employeemode();},
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function conflicts(){
    let url = 'vreqs';
    let errmsg = 'Get Requests Failed';
    setsprops(s(1,['Getting Requests...']));

    fun.genreq(url,null).then(
      jso => rsuc('PTO Conflicts',4,fun.checkconflicts(jso)),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function cpass(){
    let url = 'cpass'
    let errmsg = 'Password Change Failed';
    let cname = document.getElementById('i0').value;
    let opass = document.getElementById('i1').value;
    let npass = document.getElementById('i2').value;
    let cpass = document.getElementById('i3').value;
    document.getElementById('i0').value = '';
    document.getElementById('i1').value = '';
    document.getElementById('i2').value = '';
    document.getElementById('i3').value = '';
    setsprops(s(1,['Changing Password...']));

    Promise.all([fun.encrypt(fun.G.pkey,opass),fun.encrypt(fun.G.pkey,npass),fun.encrypt(fun.G.pkey,cpass)]).then(
      pas => fun.genreq(url,{cname:cname,opass:fun.tobase64(pas[0]),npass:fun.tobase64(pas[1]),cpass:fun.tobase64(pas[2])}),
      err => {throw Error('Encryption failed',{cause:err});}
    ).then(
      jso => rsuc('Password Changed'),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function cuser(){
//    if(document.getElementById('i0').value === '')
//      setsprops(s(1,['Failed: Empty String']));
//    else{
      let url = 'cuser';
      let errmsg = 'Create User Failed';
      setsprops(s(1,['Creating User...']));

      fun.genreq(url,{nuname:document.getElementById('i0').value}).then(
        jso => setsprops(s(1,['User Created'])),
        err => {throw Error(errmsg,{cause:err});}
      ).catch(rfail);
//    }
  }

  function duser(){
    let url = 'duser';
    let errmsg = 'Delete User Failed';
    setsprops(s(1,'Deleting User...'));

    fun.genreq(url,{dname:document.getElementById('i0').value}).then(
      jso => setsprops(s(1,['User Deleted'])),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function lemp(){
    let url = 'lemp';
    let errmsg = 'Get Users Failed';
    setsprops(s(1,['Retrieving Data...']));

    function mklist(usrs){
      return usrs.map(e => e.id);
    }

    fun.genreq(url,null).then(
      jso => rsuc('Registered Employees',2,mklist(jso)),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(err => {
      setsprops(s(1,[errmsg]));
      console.error(err);
    });
  }

  function loadshifts(store){
    let url = 'loadshifts';
    let errmsg = 'Get Shifts Failed';

    fun.genreq(url,{store:store}).then(
      jso => {Object.values(jso[0]).forEach((e,i) => document.getElementById('inputs').children[i].value = e);},
      err => {throw Error(errmsg,{cause:err});}
    ).catch(err => {
      setsprops(s(1,[errmsg]));
      console.error(err);
    });
  }

  function loaddatteln(){
    loadshifts('datteln');
  }

  function mplan(){
    setsprops(s(1,['Month Planner']))
    setoprops(o(3,['Sunday','Weekday','Saturday']));
    setiprops(i(3,
      ['time',        'time',         'time',          'time',     'time',       'time',      
       'time',       'time',        'time',         'date',      'text'],
      ['Sunday Start','Weekday Start','Saturday Start','Sunday SC','Weekday SC','Saturday SC',
       'Sunday Ende','Weekday Ende','Saturday Ende','Start Date','Store']
    ));
    setbprops(b(3,
      [ loaddatteln,   savedatteln,   mshifts,         sday,              vshifts,      mainpage,logout],
      ['Load Datteln','Save Datteln','Generate Month','Save Special Day','View Shifts','Back','Log Out']));
  }

  function mshifts(){
    let url = 'vreqs';
    let errmsg = 'Get Requests Failed';

    fun.genreq(url,null).then(
      jso => console.log(fun.shiftconfs(fun.genshifts(Array.from(document.getElementById('inputs').children).map(e=>e.value),document.getElementById('i9').value,null),jso)),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function preqs(){
    let url = 'preqs'
    let errmsg = 'Purge Failed';
    let conf = document.getElementById('i0').value

    if(conf !== 'PURGE')
      setsprops(s(1,['Type "PURGE" and press button again']));
    else{
      setsprops(s(1,['Purging...']));
      fun.genreq(url,{checkphrase:conf}).then(
        jso => setsprops(s(1,['Requests Purged'])),
        err => {throw Error(errmsg,{cause:err});}
      ).catch(err => {
        setsprops(s(1,[errmsg]));
        console.error(err);
      });
    }
  }

  function rpreq(){
    let id = document.getElementById('inputs').children.item(document.getElementById('inputs').children.length - 1).value;

    if(id){
      let url = 'rpreq'
      let errmsg = 'Delete Failed';
      setsprops(s(1,['Deleting...']));

      fun.genreq(url,{id:id}).then(
        jso => setsprops(s(1,['Request Deleted'])),
        err => {throw Error(errmsg,{cause:err});}
      ).catch(err => {
          setsprops(s(1,[errmsg]));
          console.error(err);
      });
    }
    else setsprops(s(1,['Failed: Empty String']));
  }

  function saveshifts(store){
    let url = 'saveshifts';
    let errmsg = 'Save Failed';
    console.log(Array.from(document.getElementById('inputs').children).slice(0,-1).map((e,i) => e.value).toString());

    fun.genreq(url,{shifts:store+"','"+Array.from(document.getElementById('inputs').children).slice(0,-1).map((e,i) => e.value).toString().replaceAll(',',"','")}).then(
      jso => setsprops(s(1,['Shifts Saved'])),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(err=>{
      setsprops(s(1,[errmsg]));
      console.error(err);
    });
  }

  function savedatteln(){
    saveshifts('datteln');
  }

  function sday(){
  }

  function termconns(){
    let url='reset';
    let errmsg='Reset Failed';
    let conf = document.getElementById('i0').value

    if(conf !== 'RESET')
      setsprops(s(1,['Type "RESET" and press button again']));
    else{
      setsprops(s(1,['Terminating...']));

      fun.genreq(url,{checkphrase:conf}).then(
        jso => loginpage(),
        err => {throw Error(errmsg,{cause:err});}
      ).catch(rfail);
    }
  }

  function spreq(){
    let start = document.getElementById('i0').value
    let end = document.getElementById('i1').value

    if((start) && (end) && Date.parse(start) < Date.parse(end)){
      let url = 'spreq'
      setsprops(s(1,['Submitting...']));

      fun.genreq(url,{start:start,end:end}).then(
        jso => setsprops(s(1,['Request Submitted'])),
        err => {throw Error('Request Submission Failed',{cause:err});}
      ).catch(err => {
         setsprops(s(1,['Request Submission Failed']));
         console.error(err);
      });
    } else setsprops(s(1,['Failed: Empty String or Invalid Range']));
  }

  function vreqs(){
    let url = 'vreqs';
    let errmsg = 'Get Requests Failed';
    setsprops(s(1,['Getting Requests...']));

    function mklist(jso){
      let lst = ['Request ID','Employee ID','Start (D-M-Y H:M)','End (D-M-Y H:M)'];
      jso.forEach((e,i) => lst = lst.concat([e.id,e.emp,fun.yurptime(e.startdate),fun.yurptime(e.enddate)]));
      return(lst);
    }

    fun.genreq(url,null).then(
      jso => {setsprops(s(1,['Active PTO Requests']));setoprops(o(4,mklist(jso)));},
      err => {throw Error(errmsg,{cause:err});}
    ).catch(err => {
      setsprops(s(1,[errmsg]));
      setoprops(null);
      console.error(err);
    });
  }

  function vshifts(){
  }

/***
 E002 END BUTTON FUNCTIONS
 ***/

  return (<comps.Page sprops={sprops} oprops={oprops} iprops={iprops} bprops={bprops}/>);
}
