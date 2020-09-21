import React from 'react'

import '../../assets/scss/loader.scss';

import { motion } from 'framer-motion';

export default () => {
    return (
        <React.Fragment>
            <div className="loader-container">
                <div className="pong-loader"></div>
                <motion.div className="loader-phrase" animate={{ scale: [1, 1.1, 1] }} transition={{ loop: Infinity }}>Loading....</motion.div>
            </div>
        </React.Fragment>
    )
}