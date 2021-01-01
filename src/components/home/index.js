import React from 'react'

import { motion } from 'framer-motion';

import { Link, useHistory } from 'react-router-dom';

// CSS
import '../../assets/css/home.css';

// Global State
import GlobalState from '../../context/globalState';

export default () => {

  const history = useHistory();

  const globalState = React.useContext(GlobalState);

    return (
        <React.Fragment>
          <div className="grid-container">
           <div className="topBar">
            <motion.img src={globalState.logo} onClick={() => history.push('/Home')} alt="img" className={"min-logo"} initial={{ y: '-50vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'backOut' }} whileHover={{ scale: 1.2 }} drag dragElastic={1} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}/>
             <motion.img src={globalState.design} alt="img" className={"min-design img img-thumbnail"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeOut' }} />
           </div>
           <motion.img src={globalState.logo} onClick={() => history.push('/Home')} alt="img" className={"logo"} initial={{ y: '-50vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'backOut' }} whileHover={{ scale: 1.2 }} drag dragElastic={1} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}/> 
           <motion.img src={globalState.design} alt="img" className={"design1 img img-thumbnail"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeOut' }} />
           {/* <motion.img src={design} alt="img" className={"design2 img img-thumbnail"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeOut' }} /> */}
          <motion.img src={globalState.homeAvatar} alt="loading...." className={"avatar1 img-thumbnail"} initial={{ x: '-20vw' }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.5, ease: 'linear' }} whileHover={{ opacity: 0 }} />
          <motion.p className="greet1" initial={{ y: '-100vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'easeOut' }}>Hello There!</motion.p>
           <motion.p className="greet2" initial={{ y: '-100vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'easeOut' }}>I'm Aadarsh velu.</motion.p>
           <motion.div className="btn connectBtnBase" initial={{ x: '-170vw' }} animate={{ x: 0 }} transition={{ type: 'tween', ease: 'easeOut', delay: 1, duration: 1 }}>
             <motion.div className="connectBtn" whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.6 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
               <a href="mailto:aadarshvelu@gmail.com?subject = Hello Aadarsh!" rel="noopener noreferrer" target={"_blank"}>
                Let's Connect!
               </a>
             </motion.div>
           </motion.div>
           <motion.div className="btn abtPageBtnBase" initial={{ x: '170vw' }} animate={{ x: 0 }} transition={{  type: 'tween', ease: 'easeOut', delay: 1, duration: 1 }}>
             <Link to="/Skills" style={{ textDecoration: 'none', color: 'rgba(0, 0, 0, 0.87)' }}>
                <motion.div className="abtPageBtn" whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.6 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                  Wanna See My Skills ?
                </motion.div>
             </Link>
           </motion.div>
           <div className="space" />
          </div>
        </React.Fragment>  
    )
}