import React from 'react'

import { motion } from 'framer-motion';

import { useHistory } from 'react-router-dom';

// CSS
import '../../assets/css/contact.css';

// Global State
import GlobalState from '../../context/globalState';

const Contact = () => {

    const globalState = React.useContext(GlobalState);

    const history = useHistory();

    return (
        <React.Fragment>
            <div className="contact-grid">
                <div className="topBar">
                  <motion.img src={globalState.logo} onClick={() => history.push('/Home')} alt="img" className={"min-logo"} initial={{ y: '-50vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'backOut' }} whileHover={{ scale: 1.2 }} drag dragElastic={1} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}/>
                  <motion.img src={globalState.design} alt="img" className={"min-design img img-thumbnail"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeOut' }} />
                </div>
                <motion.img src={globalState.logo} onClick={() => history.push('/Home')} alt="img" className={"logo"} initial={{ y: '-50vw' }} animate={{ y: 0 }} transition={{ type: 'spring', mass: 1, ease: 'backOut' }} whileHover={{ scale: 1.2 }} drag dragElastic={1} dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}/> 
                <motion.img src={globalState.design} alt="img" className={"design1 img img-thumbnail"} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ease: 'easeOut' }} />
                <motion.div className="sectionOne" initial={{ x: '-170vw' }} animate={{ x: 0 }} transition={{ duration: 1, ease: 'easeOut' }}>
                    <div className="partOne">
                        <motion.img src={globalState.summaryTwo} alt="img" className={"summary2 img img-thumbnail"} whileHover={{ scale: 1.1 }} transition={{ ease: 'backOut', duration: 0.5 }}/>
                    </div>
                    <div className="partTwo">
                        <p className={"intro-title"}>Catch Me At Here!</p>
                        <motion.div className="insta" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.8 }}>
                            <img src={globalState.insta} alt="" className={"insta-icon"} />
                            <p className="insta-text"><a href="https://www.instagram.com/aadarshvelu/" rel="noopener noreferrer" target={"_blank"}>@aadarshvelu</a></p>
                        </motion.div>
                        <motion.div className="mail" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.8 }}>
                            <img src={globalState.gmail} alt="" className={"mail-icon"} />
                            <p className="mail-text"><a href="mailto:aadarshvelu@gmail.com?subject = Hello Aadarsh!" rel="noopener noreferrer" target={"_blank"}>aadarshvelu@gmail.com</a></p>
                        </motion.div>
                        <motion.div className="linkedIn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.8 }}>
                            <img src={globalState.linkedIn} alt="" className={"linkedIn-icon"} />
                            <p className="linkedIn-text"><a href="https://www.linkedin.com/in/aadarsh-velu-36b274143/" rel="noopener noreferrer" target={"_blank"}>Aadarshvelu</a></p>
                        </motion.div>
                    </div>
                </motion.div>
                <motion.div className="sectionTwo" initial={{ x: '170vw' }} animate={{ x: 0 }} transition={{ duration: 1, ease: 'easeOut' }}>
                    <motion.img src={globalState.contactAvatar} alt="img" className={"avatar4 img img-thumbnail"} whileHover={{ opacity: 0, duration: 0.5 }} />
                </motion.div>
            </div>
        </React.Fragment>
    )
}

export default Contact;