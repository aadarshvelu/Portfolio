import React from 'react'

import { motion } from 'framer-motion';

// router
import { Link, useHistory } from 'react-router-dom';

// CSS
import '../../assets/css/work.css';

// resume
import Resume from '../../assets/Resume.pdf';

import GlobalState from '../../context/globalState';

const Work = () => {

    const globalState = React.useContext(GlobalState);
    
    const history = useHistory();

    return (
        <React.Fragment>
            <div className="work-container">
                <div className="topBar">
                  <motion.img src={globalState.logo} alt="img" onClick={() => history.push('/Home')} className={"min-logo"} initial={{ y: '-50vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'easeOut' }} whileHover={{ scale: 1.2 }} drag dragElastic={1} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}/>
                  <motion.img src={globalState.design} alt="img" className={"min-design img img-thumbnail"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeOut' }} />
                </div>
                <motion.img src={globalState.logo} alt="img" onClick={() => history.push('/Home')} className={"logo"} initial={{ y: '-50vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'easeOut' }} whileHover={{ scale: 1.2 }} drag dragElastic={1} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}/>
                <motion.img src={globalState.design} alt="img" className={"design img img-thumbnail"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeOut' }} />
                <div className="cards">
                    <motion.p className="projGreet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>My Projects!</motion.p>
                    <div className="section1">
                        <motion.div className="item3" whileHover={{ scale: 1.2 }} transition={{ type: 'spring', ease: 'easeOut' }}>                            
                            <a href="http://mypass-webapp.herokuapp.com/" target="_blank"  rel="noopener noreferrer">
                                <motion.img src={globalState.project1} initial={{ y: '-370vw', rotate: '10deg' }} animate={{ y: 0 }} transition={{ type: 'spring', duration: 2, mass: 0.5, ease: 'easeOut', delay: 0.8 }} alt="img" className={"p1 img img-thumbnail"} />
                            </a>
                        </motion.div>
                    </div>
                    <div className="section2">
                        <motion.div className="item2" whileHover={{ scale: 1.2 }} transition={{ type: 'spring', ease: 'easeOut' }}>
                            <a href="https://dsavisually.netlify.app/" target="_blank"  rel="noopener noreferrer">
                                <motion.img initial={{ y: '-270vw' }} animate={{ y: 0, rotate: '-15deg' }} transition={{ type: 'spring', mass: 0.5, duration: 2, ease: 'easeOut', delay: 0.8 }} src={globalState.project3} alt="img" className={"p3 img img-thumbnail"} />
                            </a>
                        </motion.div>
                        <motion.div className="item1" whileHover={{ scale: 1.2 }} transition={{ type: 'spring', ease: 'easeOut' }}>
                            <a href="http://listenify.herokuapp.com/" target="_blank"  rel="noopener noreferrer">                            
                                <motion.img initial={{ y: '-270vw' }} animate={{ y: 0, rotate: '-20deg' }} transition={{ type: 'spring', mass: 0.5, duration: 2, ease: 'easeOut', delay: 0.8 }} src={globalState.project2} alt="img" className={"p2 img img-thumbnail"} />
                            </a>
                        </motion.div>
                    </div>
                </div>
                <div className="getResume">
                    <motion.p className="phrase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>Wanna Hire Me ?</motion.p>
                    <div className="ava3Base">
                        <a href={Resume} download={"Aadarsh's_Resume"} rel="noopener noreferrer" target="_blank">
                            <motion.img className="avatar3 img img-thumbnail" src={globalState.workAvatar} alt="img" animate={{ y: [-15, 15, -15] }} transition={{ duration: 2, ease: "easeInOut", loop: Infinity, }}/>
                        </a>
                    </div>
                    <motion.div className="btn contactPageBtnBase" initial={{ x: '170vw' }} animate={{ x: 0 }} transition={{  type: 'tween', delay: 0.8, ease: 'easeOut', duration: 1 }}>
                      <Link to="/Contact" style={{ textDecoration: 'none', color: 'rgba(0, 0, 0, 0.87)' }}>
                         <motion.div className="contactPageBtn" whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.6 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                           Wanna See My Contact ?
                         </motion.div>
                      </Link>
                    </motion.div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default Work;