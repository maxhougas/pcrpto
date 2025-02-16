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
   setiprops(null);
   setbprops({grid:3,
     handler:[ memp,              mreq,             mshifts,        cpasspage,        termconns,              logout],
     btxt:   ['Manage Employees','Manage Requests','Manage Shifts','Change Password','Terminate Connections','Log Out']
   });
  }

  function cpasspage(){
    setsprops({grid:1,status:['Change Password']});
    setoprops(null);
    setiprops({grid:2,type:['text','password','password','password'],itxt:['Username','Old Password','New Password','Confirm Password']});
    setbprops({grid:2,handler:[cpass,mainpage,logout],btxt:['Confirm','Back','Log Out']});
  }

  function employeemode(){
    setsprops({grid:1,status:['Employee Mode']});
    setoprops(null);
    setiprops({grid:2,
      type:['datetime-local',      'datetime-local',    'text'],
      itxt:['Start:YYYYMMDDHHMMSS','End:YYYYMMDDHHMMSS','Ausweis']
    });
    setbprops({grid:2,
      handler:[ reqs,            reqr,            reqv,           cpasspage,        logout],
      btxt   :['Submit Request','Revoke Request','View Requests','Change Password','Log Out']
    });
  }

  function memp(){
    setsprops({grid:1,status:['Manage Employees']});
    setoprops(null);
    setiprops({grid:2,type:['text','text'],itxt:['Employee','Store']});
    setbprops({grid:3,
      handler:[ empl,            empc,             empd,             storel,       storec,        stored,        storelas,          storeasg,      storeuas,        bossmode,logout],
      btxt   :['List Employees','Create Employee','Delete Employee','List Stores','Create Store','Delete Store','List Assignments','Assign Store','Unassign Store','Back',  'Log Out']
    });
  }

  function mreq(){
    setsprops({grid:1,status:['Manage Requests']});
    setoprops(null);
    setiprops({grid:1,type:['number'],itxt:['Ausweis']});
    setbprops({grid:3,handler:[reql,reqr,reqp,bossmode,logout],btxt:['List Requests','Remove Request','Purge Requests','Back','Log Out']});
  }

  function mshifts(){
    setsprops({grid:1,status:['Manage Shifts']})
    setoprops({grid:3,outputs:['Sunday','Weekday','Saturday']});
    setiprops({grid:3,
      type:['time',        'time',         'time',          'time',     'time',       'time',      
            'time',       'time',        'time',         'date',      'text'],
      itxt:['Sunday Start','Weekday Start','Saturday Start','Sunday SC','Weekday SC','Saturday SC',
            'Sunday Ende','Weekday Ende','Saturday Ende','Start Date','Store']
    });
    setbprops({grid:3,
      handler:[ shiftload,    shiftsave,    shiftmk,         sday,              shiftv,       mainpage,logout],
      btxt   :['Load Shifts','Save Shifts','Generate Month','Save Special Day','View Shifts','Back',  'Log Out']
    });
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
 S002 START REQUEST FUNCTIONS
 ***/

  function login(){
    let url = 'login';
    let errmsg = 'Login Failed';
    fun.G.uname = fun.txtbox('i0');
    let pass = fun.txtbox('i1');
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

/*  function conflicts(){
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
    let cname = fun.txtbox('i0');
    let opass = fun.txtbox('i1');
    let npass = fun.txtbox('i2');
    let cpass = fun.txtbox('i3');
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
*/

  function empc(){
    let url = 'empc';
    let errmsg = 'Create User Failed';
    setsprops(s(1,['Creating User...']));

    fun.genreq(url,{nuname:fun.txtbox('i0')}).then(
      jso => setsprops(s(1,['User Created'])),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function empd(){
    let url = 'empd';
    let errmsg = 'Delete User Failed';
    setsprops(s(1,'Deleting User...'));

    fun.genreq(url,{dname:fun.txtbox('i0')}).then(
      jso => setsprops(s(1,['User Deleted'])),
      err => {throw Error(errmsg,{cause:err});}
    ).catch(rfail);
  }

  function empl(){
    let url = 'empl';
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

  function reql(){
    let url = 'reql';
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

  function reqp(){
    let url = 'reqp'
    let errmsg = 'Purge Failed';
    let conf = fun.txtbox('i0');

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

  function reqr(){
    let id = document.getElementsById('inputs').children.item(document.getElementById('inputs').children.length - 1).value;

    if(id){
      let url = 'reqr'
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

  function reqs(){
    let start = fun.txtbox('i0');
    let end = fun.txtbox('i1');

    if((start) && (end) && Date.parse(start) < Date.parse(end)){
      let url = 'reqs'
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

  function sday(){
  }

  function shiftload(){
    setsprops(s(1,['Getting Shifts...']));

    fun.genreq('shiftload',{store:fun.txtbox('i10')}).then(
      jso => {Object.values(jso[0]).forEach((e,i) => document.getElementById('inputs').children[i].value = e);},
      err => {throw Error('Get Shifts Failed',{cause:err});}
    ).catch(rfail);
  }

  function shiftmk(){

    function mklist(cnfs){
      let lst = [];
      cnfs.forEach(e => {lst = lst.concat(e.date); lst = lst.concat('1: '+e.shift0.toString()); lst = lst.concat('2: '+e.shift1.toString());});
      return lst;
    }

    setsprops(s(1,['Generating Conflicts...']));

    Promise.all([fun.genreq('shiftload',{store:fun.txtbox('i10')}),fun.genreq('reql',null)]).then(
      jso => fun.shiftconfs(fun.genshifts(fun.txtbox('i9'),Object.values(jso[0][0])),jso[1]),
      err => {throw Error('Get default shifts failed',{cause:err});}
    ).then(
      cnf => rsuc(fun.txtbox('i10')+' conflicts',3,mklist(cnf)),
      err => {throw Error('Data Formatting Failed',{cause:err});}
    ).catch(rfail);
  }

  function shiftsave(){
    setsprops(s(1,'Saving Shifts...'));

    fun.genreq('shiftsave',{shifts:Array.from(document.getElementById('inputs').children).slice(0,8).map((e) => e.value),store:fun.txtbox('i10')}).then(
      jso => setsprops(s(1,['Shifts Saved'])),
      err => {throw Error('Save Failed',{cause:err});}
    ).catch(rfail);
  }

  function shiftv(){
  }

  function storeasg(){
    setsprops(s(1,['Assigning...']));

    fun.genreq('storeasg',{emp:fun.txtbox('i0'),store:fun.txtbox('i1')}).then(
      jso => rsuc('Assigned',null,null),
      err => {throw Error('Assignment Failed',{cause:err});}
    ).catch(rfail);
  }

  function storec(){
    setsprops(s(1,['Creating Store...']));

    fun.genreq('storec',{store:fun.txtbox('i1')}).then(
      jso => rsuc('Created',null,null),
      err => {throw Error('Create Failed',{cause:err});}
    ).catch(rfail);
  }

  function stored(){
    setsprops(s(1,['Deleting Store...']));

    fun.genreq('stored',{store:fun.txtbox('i1')}).then(
      jso => rsuc('Deleted',null,null),
      err => {throw Error('Delete Failed',{cause:err});}
    ).catch(rfail);
  }

  function storel(){
    setsprops(s(1,['Getting Stores...']));

    fun.genreq('storel',null).then(
      jso => rsuc('Stores',3,jso.map(e => e.id)),
      err => {throw Error('Get Stores Failed',{cause:err});}
    ).catch(rfail);
  }

  function storelas(){

    function mklist(jso){
      let out = ['Employee','Store'];
      jso.forEach(e => {out = out.concat([e.emp,e.store]);});
      return out;
    }

    setsprops(s(1,['Getting Assignments...']));

    fun.genreq('storelas',{store:fun.txtbox('i1'),emp:fun.txtbox('i0')}).then(
      jso => rsuc('Store Assignments',2,mklist(jso)),
      err => {throw Error('Get stores failed',{cause:err});}
    ).catch(rfail);
  }

  function storeuas(){
    setsprops(s(1,['Unassigning...']));

    fun.genreq('storeuas',{emp:fun.txtbox('i0'),store:fun.txtbox('i1')}).then(
      jso => rsuc('Unassigned',null,null),
      err => {throw Error('Unassignment Failed',{cause:err});}
    ).catch(rfail);
  }

  function termconns(){
    let url='reset';
    let errmsg='Reset Failed';
    let conf = fun.txtbox('i0');

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

/***
 E002 END REQUEST FUNCTIONS
 ***/

  return (<comps.Page sprops={sprops} oprops={oprops} iprops={iprops} bprops={bprops}/>);
}
