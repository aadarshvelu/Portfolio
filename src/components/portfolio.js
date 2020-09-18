import React from 'react';
import RotatingText from 'react-rotating-text';
import {BsChevronDown} from 'react-icons/bs';
import {motion} from 'framer-motion';
import { FullPage, Slide } from 'react-full-page';
import Coverflow from 'react-coverflow';
import { GrInstagram } from 'react-icons/gr';
import { FaLinkedinIn} from 'react-icons/fa';
import { MdMarkunreadMailbox } from 'react-icons/md';
import Resume from '../assets/Resume.pdf';

import '../App.css'

import avatar from '../assets/avatar/ava1.svg'

import avatar2 from '../assets/avatar/ava2.svg'

import avatar3 from '../assets/avatar/ava3.svg'

import avatar4 from '../assets/avatar/ava6.svg'

import avatar5 from '../assets/avatar/ava4.svg'

import avatar6 from '../assets/avatar/ava5.svg'

import SkillSet from '../assets/skillset.svg'

import summaryOne from '../assets/summary1.svg'

import summaryTwo from '../assets/summary2.svg'

import design from '../assets/design.svg'

import project1 from '../assets/projectsList/P1.svg'

import project2 from '../assets/projectsList/p2.svg'

import project3 from '../assets/projectsList/p3.svg'

const portfolio = () => {

    return ( 
        <React.Fragment>
            <div className="designTop">
                <img src={design} alt="" style={{ width: '1000px', height: '300px' }}/>
            </div>
            <div className="designBottom">
                <img src={design} alt="" style={{ width: '1000px', height: '300px' }}/>
            </div>
              <FullPage>
                <Slide>
                  <div className="particle-canvas row">
                    <motion.div className="canvas-overlap typewriter" initial={{ y: '-100vw' }} animate={{ y: 0 }} transition={{ duration: 1.5, type: 'spring', mass: 1 }}>
                      <RotatingText items={['Hello There ?', 'This is Aadarsh velu !']} />
                    </motion.div>
                    <motion.div className="canvas-overlap avatar" initial={{ x: '-18vw' }} animate={{ x: -5 }} transition={{ duration: 1, type: 'tween', ease: 'easeOut' }} >
                      <img src={avatar} alt="" className="img img-thumbnail" />
                    </motion.div>
                    <motion.div className="canvas-overlap message" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.5, loop: Infinity }}>
                      Wanna Know About Me ?
                    </motion.div>
                    <motion.div className="canvas-overlap downIcon" animate={{ y: [-15, 15, -15] }} transition={{ duration: 2, ease: "easeInOut", loop: Infinity, }}>
                      <BsChevronDown/>
                    </motion.div>
                  </div>
                </Slide>
                <Slide>
                  <div className="">
                  <div className="row">
                    <div className="col" style={{ paddingLeft: '50px' }}>
                      <div className="col d-flex">
                        <motion.img className="img-thumbnail" src={avatar2} alt="" style={{ width: '200px', height: '230px' }}  initial={{ opacity: 1 }} whileHover={{ opacity: 0 }} transition={{ ease: 'backOut', duration: 0.4}}/>
                      </div>
                      <motion.img className="summary img-thumbnail" src={summaryOne} alt="" whileHover={{ scale: 1.2 }} transition={{ ease: 'backOut', duration: 0.8}}/>
                    </div>
                    <motion.div className="col-lg-5 p-4 skillSet">
                      <div className="d-flex justify-content-center">
                        <motion.img className="skillSet img-thumbnail" src={SkillSet} alt="" style={{ width: '500px', height: '450px' }} initial={{ y: 0 }}  animate={{ y: [-10, 10, -10] }} transition={{ duration: 1.5, ease: "easeInOut", loop: Infinity, }}/>
                      </div>
                      <div className="d-flex justify-content-center">
                        <motion.img className="img-thumbnail" src={avatar4} alt="" style={{ width: '200px', height: '180px' }}  initial={{ opacity: 1 }} whileHover={{ opacity: 0 }} transition={{ ease: 'backOut', duration: 0.4}}/>
                      </div>
                    </motion.div>
                  </div>
                  </div>
                </Slide>
                <Slide>
                  <div className="row">
                    <div className="col">
                      <motion.img className="img-thumbnail d-none d-lg-block" src={avatar3} alt="" style={{ width: '300px', height: '300px' }}  initial={{ opacity: 1 }} whileHover={{ opacity: 0 }} transition={{ ease: 'backOut', duration: 0.4}}/>
                    </div>
                  </div>
                  <div>
                  <div className="row">
                  <div className="col text-center" style={{ fontSize: '30px'}}>
                      <p>My Achievements : </p>
                  </div>
                    <div className="ml-lg-5">
                      <div className="row d-flex justify-content-center">
                        <div className="card col-lg-2 col-md-4 px-0" style={{ width: '50%' }}>
                          <img src={project1} className="card-img-top" alt="..."/>
                          <div className="card-body">
                            <p className="card-text">A Secure web-based Online Password Manager .</p>
                          </div>
                        </div>
                        <div className="card col-lg-2 col-md-4 px-0 mx-5 my-md-4 my-lg-0" style={{ width: '50%' }}>
                          <img src={project2} className="card-img-top" alt="..."/>
                          <div className="card-body">
                            <p className="card-text">The Collaborative and Fun Way To Learn Data Structures and Algorithms.</p>
                          </div>
                        </div>
                        <div className="card col-lg-2 col-md-4 px-0" style={{ width: '50%' }}>
                          <img src={project3} className="card-img-top" alt="..."/>
                          <div className="card-body">
                            <p className="card-text">A World's First 8D Online Player With Some Cool Stuff Like Visualizations, And Lot More Included In Box.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </Slide>
                <Slide className={"slide-4"}>
                  <div className="row pl-4">
                    <div className="col m-5">
                      <motion.img className="img-thumbnail" style={{ marginTop: '50px' }} src={summaryTwo} alt="" whileHover={{ scale: 1.2 }} transition={{ ease: 'backOut', duration: 0.8}}/>
                    </div>
                    <div className="col mt-4">
                      <motion.img className="img-thumbnail" src={avatar5} alt="" style={{ width: '600px', height: '300px' }}  initial={{ opacity: 1 }} whileHover={{ opacity: 0 }} transition={{ ease: 'backOut', duration: 0.4}}/>
                    </div>
                  </div>
                  <div className="row slide-4-final">
                    <div className="col d-flex justify-content-center flex-wrap">
                      <div className="m-5">
                        <h3>Wanna Hire Me ?</h3>
                          <a href={Resume} download={"Aadarsh's_Resume"} rel="noopener noreferrer" target="_blank">
                            <motion.img className="img-thumbnail" src={avatar6} alt="" style={{ width: '200px', height: '180px' }} animate={{ y: [-15, 15, -15] }} transition={{ duration: 2, ease: "easeInOut", loop: Infinity, }}/>
                          </a>
                      </div>
                      <div className="m-5 text-center">
                          <h3>Reach out to me here !</h3>
                          <h4><MdMarkunreadMailbox className={"pr-2"} style={{ fontSize: '40px' }} /><a href="mailto:aadarshvelu@gmail.com" rel="noopener noreferrer" target={"_blank"}>aadarshvelu@gmail.com</a></h4>
                          <h4><GrInstagram className={"pr-2"} style={{ fontSize: '40px' }} /><a href="https://www.instagram.com/aadarshvelu_/" rel="noopener noreferrer" target={"_blank"}>@aadarshvelu</a></h4>
                          <h4><FaLinkedinIn className={"pr-2"} style={{ fontSize: '30px' }} /><a href="https://www.linkedin.com/in/aadarsh-velu-36b274143/" rel="noopener noreferrer" target={"_blank"}>Aadarshvelu</a></h4>
                      </div>
                    </div>
                  </div>
                </Slide>
            </FullPage> 
        </React.Fragment>
     );
}

export default portfolio;