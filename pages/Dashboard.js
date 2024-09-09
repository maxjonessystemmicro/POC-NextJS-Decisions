import React, { useState } from 'react';
import styles from './dashboard.module.css';


function Dashboard() {
    const [ExpectedPayload, setExpectedPayload] = useState(
        {UserEmail:null,Message:'Empty',LastUpdate:null,LastUpdatedBy:null,ReturnSession: null}

    );

    function Clear() {
        setExpectedPayload({UserEmail:null,Message:'Empty',LastUpdate:null,LastUpdatedBy:null,ReturnSession: null});
    }

    return (
        <div>
            <div className={styles.dataContainer}>
                <div>UserEmail: {ExpectedPayload.UserEmail}</div>
                <div>Message: {ExpectedPayload.Message}</div>
                <div>LastUpdate: {ExpectedPayload.LastUpdate}</div>
                <div>LastUpdateBy: {ExpectedPayload.LastUpdatedBy}</div>
                <div><br/></div>
                <div>Return Session: {ExpectedPayload.ReturnSession}</div>
            </div>
            <div className={styles.buttonDiv}>
                <button className={styles.button}>Return</button>
                <button className={styles.button}>Reset</button>
                <button className={styles.button} onClick={() => Clear(1)}>Clear</button>
            </div>
        </div>
    );
}

export default Dashboard;