import React from 'react'

import '../../assets/scss/loader.scss';

import { motion } from 'framer-motion';

// Global State Context
import GlobalState from '../../context/globalState';

export default () => {

    const globalState = React.useContext(GlobalState);

    console.log(globalState.loadingPercentile, globalState.loadingPercentile !== undefined)

    return (
        <React.Fragment>
            <div className="loader-container">
                <div className="pong-loader" />
                <motion.div className="loader-phrase">{` ${(globalState.loadingPercentile !== undefined) ? parseInt(globalState.loadingPercentile) : 0} % `}</motion.div>
            </div>
        </React.Fragment>
    )
}