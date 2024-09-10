import React, { useState } from 'react';
import { useEffect } from 'react';
import styles from './dashboard.module.css';


function Dashboard() {

    useEffect(() => {
        SyncSession();
      }, []);

    const [ExpectedPayload, setExpectedPayload] = useState(
        {UserEmail:null,Message:'Empty',LastUpdate:null,LastUpdatedBy:null,ReturnSession: null}
    );

    const [CustomMessage, setCustomMessage] = useState(
    );

    function Clear() {
        setExpectedPayload({UserEmail:null,Message:'Empty',LastUpdate:null,LastUpdatedBy:null,ReturnSession: null});
        localStorage.setItem("ExpectedPayload", JSON.stringify({UserEmail:null,Message:null,LastUpdate:null,LastUpdatedBy:null,ReturnSession: null}));

    }

    function Save(e) {
        setExpectedPayload({UserEmail:null,Message:CustomMessage,LastUpdate:null,LastUpdatedBy:null,ReturnSession: null});
        localStorage.setItem("ExpectedPayload", JSON.stringify({UserEmail:null,Message:CustomMessage,LastUpdate:null,LastUpdatedBy:null,ReturnSession: null}));
     
    }

    function updateInputValue(e){
        setCustomMessage(e.target.value);
    }

    function backButton(e){
        window.history.back();
    }

    function SyncSession(){
        let Payload = JSON.parse(window.localStorage.getItem("ExpectedPayload"));
        if(Payload){
            setExpectedPayload(Payload);
        }else{
            setExpectedPayload( {UserEmail:null,Message:'NOT FOUND',LastUpdate:null,LastUpdatedBy:null,ReturnSession: null});
        }
    }

    return (
        <div>
            <div className={styles.dataContainer}>
                <div>UserEmail: {ExpectedPayload.UserEmail}</div>
                <div>Message: {ExpectedPayload.Message}</div>
                <div>LastUpdate: {ExpectedPayload.LastUpdate}</div>
                <div>LastUpdateBy: {ExpectedPayload.LastUpdatedBy}</div>
                <div>Return Session: {ExpectedPayload.ReturnSession}</div>
                <div><br/></div>
                <div>New Message: <input onChange={(e)=>updateInputValue(e)} className={styles.inputCST}></input></div>
                <button className={styles.buttonGreen} onClick={(e) => Save(e)}>Save</button>
            </div>
            <div className={styles.buttonDiv}>
                <button className={styles.button} onClick={(e) => backButton(e)} >Return</button>
                <button className={styles.button} onClick={() => SyncSession()}>Fetch Session</button>
                <button className={styles.button} onClick={() => Clear()}>Clear</button>
            </div>
        </div>
    );
}

export default Dashboard;