import React from 'react'
import { motion } from 'framer-motion';

// Router 
import { Link, useHistory } from 'react-router-dom';

// CSS
import '../../assets/css/skills.css'

// Global State
import GlobalState from '../../context/globalState';

const Skills = () => {

    const globalState = React.useContext(GlobalState);

    const history = useHistory();

    return (
        <React.Fragment>
            <div className="skills-container">
                <div className="topBar">
                  <motion.img src={globalState.logo} alt="img" onClick={() => history.push('/Home')} className={"min-logo"} initial={{ y: '-50vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'easeOut' }} whileHover={{ scale: 1.2 }} drag dragElastic={1} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}/>
                  <motion.img src={globalState.design} alt="img" className={"min-design img img-thumbnail"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeOut' }} />
                </div>
                <motion.img src={globalState.logo} alt="img" onClick={() => history.push('/Home')} className={"logo"} initial={{ y: '-50vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'easeOut' }} whileHover={{ scale: 1.2 }} drag dragElastic={1} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}/>
                <motion.img src={globalState.design} alt="img" className={"design img img-thumbnail"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeOut' }} />
                <motion.div className="skillSetBase"  initial={{ x: '-170vw' }} animate={{ x: 0 }} transition={{ type: 'tween', delay: 0.5, ease: 'easeOut', duration: 1  }}>
                    <p className={"header-title"}>My Hands Got Dirty Using These Technologies :</p>
                    <motion.div className="item-1-container" whileHover={{ scale: 1.1 }}>
                        <img src={globalState.RRLogo} alt="img" className={"item-img img-1"} />
                        <div className={"item-text item-1"}>React / Redux</div>
                    </motion.div>
                    <motion.div className="item-2-container" whileHover={{ scale: 1.1 }}>
                        <img src={globalState.reactNative} alt="img" className={"item-img img-2"} />
                        <div className={"item-text item-2"}>React Native</div>
                    </motion.div>
                    <motion.div className="item-3-container" whileHover={{ scale: 1.1 }}>
                        <img src={globalState.node} alt="img" className={"item-img img-3"} />
                        <div className={"item-text item-3"}>Node JS</div>
                    </motion.div>
                    <motion.div className="item-4-container py-md-2" whileHover={{ scale: 1.1 }}>
                        <img src={globalState.typescript} alt="img" className={"item-img img-4"} />
                        <div className={"item-text item-4"}>Typescript</div>
                    </motion.div>
                    <motion.div className="item-5-container" whileHover={{ scale: 1.1 }}>
                        <img src={globalState.java} alt="img" className={"item-img img-5"} />
                        <div className={"item-text item-5"}>Java</div>
                    </motion.div>
                    <motion.div className="item-6-container" whileHover={{ scale: 1.1 }}>
                        <img src={globalState.mongoDB} alt="img" className={"item-img img-6"} />
                        <div className={"item-text item-6"}>MongoDB</div>
                    </motion.div>
                    <motion.div className="item-7-container" whileHover={{ scale: 1.1 }}>
                      <img src={globalState.firebase} alt="img" className={"item-img img-7"} />
                      <div className={"item-text item-7"}>Firebase</div>
                    </motion.div>
                </motion.div>
                <div className="rightSide">
                    <motion.div className="base" whileHover={{ scale: 1.1 }} transition={{ ease: 'backOut', duration: 0.5 }}>
                        <motion.img src={globalState.skillsAvatar} alt="img" className={"avatar2 img img-thumbnail"} initial={{  x: '170vw' }} animate={{ x: 0 }} transition={{ type: 'tween', delay: 0.5, ease: 'easeOut', duration: 1 }} />
                        <motion.img src={globalState.summaryOne} alt="img" className={"summary1 img img-thumbnail"} initial={{x: '170vw' }} animate={{ x: 0 }} transition={{ type: 'tween', delay: 0.5, ease: 'easeOut', duration: 1 }} />
                    </motion.div>
                    <motion.div className="btn workPageBtnBase" initial={{ x: '170vw' }} animate={{ x: 0 }} transition={{  type: 'tween', delay: 0.5, ease: 'easeOut', duration: 1 }}>
                      <Link to="/Work" style={{ textDecoration: 'none', color: 'rgba(0, 0, 0, 0.87)' }}>
                         <motion.div className="workPageBtn" whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.6 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
                           Wanna See My Works ?
                         </motion.div>
                      </Link>
                    </motion.div>
                </div>
            </div>
        </React.Fragment>
    )
}

export default Skills;