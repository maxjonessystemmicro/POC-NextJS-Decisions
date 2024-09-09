import React, { useState } from 'react';
import styles from './dashboard.module.css';


function Dashboard() {
    const [score, setScore] = useState({test:'flow'});

    return (
        <div>
         <div className={styles.dataContainer}>{score.test}</div>
        </div>
    );
}

export default Dashboard;