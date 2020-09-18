import React from 'react'
import { motion } from 'framer-motion';

// Router 
import { Link } from 'react-router-dom';

// CSS
import '../../assets/css/skills.css'

// Deps 
import design from '../../assets/design.svg';
import SkillSetPanel from '../../assets/components/SkillSetPanel.svg';
import avatar from '../../assets/avatar/ava2.svg';
import summary from '../../assets/summary1.svg';

const Skills = () => {
    return (
        <React.Fragment>
            <div className="skills-container">
                <div className="topBar">
                  <motion.img src={require('../../assets/logo.gif')} alt="img" className={"min-logo"} initial={{ y: '-50vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'easeOut' }} whileHover={{ scale: 1.2 }} drag dragElastic={1} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}/>
                  <motion.img src={design} alt="img" className={"min-design img img-thumbnail"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeOut' }} />
                </div>
                <motion.img src={require('../../assets/logo.gif')} alt="img" className={"logo"} initial={{ y: '-50vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'easeOut' }} whileHover={{ scale: 1.2 }} drag dragElastic={1} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}/>
                <motion.img src={design} alt="img" className={"design img img-thumbnail"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeOut' }} />
                <motion.div className="skillSetBase" whileHover={{ scale: 1.1 }} transition={{ ease: 'backOut', duration: 0.5 }}>
                    <motion.img src={SkillSetPanel} alt="img" className={"skillSet img img-thumbnail"} initial={{ x: '-170vw' }} animate={{ x: 0 }} transition={{ type: 'tween', delay: 0.5, ease: 'easeOut', duration: 1  }} />
                </motion.div>
                <div className="rightSide">
                    <motion.div className="base" whileHover={{ scale: 1.1 }} transition={{ ease: 'backOut', duration: 0.5 }}>
                        <motion.img src={avatar} alt="img" className={"avatar2 img img-thumbnail"} initial={{  x: '170vw' }} animate={{ x: 0 }} transition={{ type: 'tween', delay: 0.5, ease: 'easeOut', duration: 1 }} />
                        <motion.img src={summary} alt="img" className={"summary1 img img-thumbnail"} initial={{x: '170vw' }} animate={{ x: 0 }} transition={{ type: 'tween', delay: 0.5, ease: 'easeOut', duration: 1 }} />
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