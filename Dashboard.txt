import React, { useState } from 'react';
import { useEffect } from 'react';



function Dashboard() {

    useEffect(() => {
        SyncSession();
      }, []);

    const [ExpectedPayload, setExpectedPayload] = useState(
        {UserEmail:null,Message:'Empty',LastUpdate:null,LastUpdatedBy:null,ReturnSession: null}
    );

    const [CustomMessage, setCustomMessage] = useState(
    );

    
    const [ReturnSession, setReturnSession] = useState(
    );
    function Clear() {
        setExpectedPayload({UserEmail:null,Message:'Empty',LastUpdate:null,LastUpdatedBy:null,ReturnSession: null});
        localStorage.setItem("ExpectedPayload", JSON.stringify({UserEmail:null,Message:null,LastUpdate:null,LastUpdatedBy:null,ReturnSession: null}));

    }

    function Save(e) {
        // setExpectedPayload({UserEmail:null,Message:CustomMessage,LastUpdate:null,LastUpdatedBy:null,ReturnSession: null});
        // localStorage.setItem("ExpectedPayload", JSON.stringify({UserEmail:null,Message:CustomMessage,LastUpdate:null,LastUpdatedBy:null,ReturnSession: null}));
        let now = new Date();
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('UserEmail', ExpectedPayload.UserEmail);
        urlParams.set('Message', CustomMessage);
        urlParams.set('LastUpdate', now.toLocaleString());
        urlParams.set('LastUpdateBy', ExpectedPayload.UserEmail);
        window.location.search = urlParams;
    }

    function updateInputValue(e){
        setCustomMessage(e.target.value);
    }

    function backButton(e){
        //https://decisions-systemmicro.ca/Primary/StudioH/?FolderId=01J7E81TTH5FVSMQXB4BGDA22A&pageName=SyncStorageScriptPage&Chrome=off/?UserEmail=max.jones@systemmicro.ca&Message=maximus&LastUpdate=9/11/2024%204:12:36%20PM&LastUpdateBy=max.jones@systemmicro.ca&ReturnSession=01J7E81TTH5FVSMQXB4BGDA22A
        // window.history.back();
        const queryString = window.location.search;
        window.location.replace('https://decisions-systemmicro.ca/Primary/StudioH/?FolderId='+ReturnSession+"&pageName=SyncStorageScriptPage&Chrome=off&/"+queryString);
    }

    function SyncSession(){
        console.log("Return url is",  document.referrer);

        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const PromptMessage = urlParams.get('UserEmail');
        if(urlParams){
            let Payload = {UserEmail:urlParams.get('UserEmail'),Message:urlParams.get('Message'),LastUpdate:urlParams.get('LastUpdate'),LastUpdatedBy:urlParams.get('LastUpdateBy'),ReturnSession: null};
            setExpectedPayload(Payload);
            setReturnSession(urlParams.get('ReturnSession'));
            console.log("found payload",Payload);
        }else{
            setExpectedPayload( {UserEmail:null,Message:'NOT FOUND',LastUpdate:null,LastUpdatedBy:null,ReturnSession: null});
            console.log("not found payload");
        }
        
    }

    return (
        <div>
            <div className={styles.dataContainer}>
                <div>UserEmail: {ExpectedPayload.UserEmail}</div>
                <div>Message: {ExpectedPayload.Message}</div>
                <div>LastUpdate: {ExpectedPayload.LastUpdate}</div>
                <div>LastUpdateBy: {ExpectedPayload.LastUpdatedBy}</div>
                {/* <div>Return Session: {ExpectedPayload.ReturnSession}</div> */}
                <div><br/></div>
                <div>New Message: <input onChange={(e)=>updateInputValue(e)} className={styles.inputCST}></input></div>
                <button className={styles.buttonGreen} onClick={(e) => Save(e)}>Save</button>
            </div>
            <div className={styles.buttonDiv}>
                <button className={styles.button} onClick={(e) => backButton(e)} >Return</button>
                {/* <button className={styles.button} onClick={() => SyncSession()}>Fetch Session</button> */}
                {/* <button className={styles.button} onClick={() => Clear()}>Clear</button> */}
            </div>
        </div>
    );
}

export default Dashboard;