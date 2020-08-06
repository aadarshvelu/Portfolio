import React from 'react';
import Particles from 'react-particles-js';
import RotatingText from 'react-rotating-text';
import {BsChevronDown} from 'react-icons/bs';
import {motion} from 'framer-motion';
import { FullPage, Slide } from 'react-full-page';

import avatar from '../assets/ava1.png'

import avatar2 from '../assets/avatar/ava2.svg'

import avatar3 from '../assets/avatar/ava3.svg'

import SkillSet from '../assets/skillset.svg'

import summaryOne from '../assets/summary1.svg'

import design from '../assets/design.svg'

const portfolio = () => {

    const particleOptions = {
      "particles": {
        "number": {
          "value": 40,
        },
        "color": {
          "value": "#6b0f24"
        },
        "shape": {
          "type": "circle",
          "stroke": {
            "width": 0,
            "color": ""
          },
          "polygon": {
            "nb_sides": 5
          },
        },
        "opacity": {
          "value": 0.5,
          "random": true,
          "anim": {
            "enable": false,
            "speed": 2,
            "opacity_min": 0.1,
            "sync": false
          }
        },
        "size": {
          "value": 3,
          "random": true,
          "anim": {
            "enable": false,
            "speed": 40,
            "size_min": 0.1,
            "sync": false
          }
        },
        "line_linked": {
          "enable": true,
          "distance": 150,
          "color": "#000000",
          "opacity": 0.4,
          "width": 1
        },
        "move": {
          "enable": true,
          "speed": 3,
          "direction": "none",
          "random": false,
          "straight": false,
          "out_mode": "out",
          "bounce": false,
          "attract": {
            "enable": false,
            "rotateX": 600,
            "rotateY": 1200
          }
        }
      },
      "interactivity": {
        "detect_on": "canvas",
        "events": {
          "onhover": {
            "enable": true,
            "mode": "grab"
          },
          "onclick": {
            "enable": true,
            "mode": "push"
          },
          "resize": true
        },
        "modes": {
          "grab": {
            "distance": 140,
            "line_linked": {
              "opacity": 1
            }
          },
          "bubble": {
            "distance": 400,
            "size": 40,
            "duration": 2,
            "opacity": 8,
            "speed": 3
          },
          "repulse": {
            "distance": 200,
            "duration": 0.4
          },
          "push": {
            "particles_nb": 4
          },
          "remove": {
            "particles_nb": 2
          }
        }
      },
      "retina_detect": true
    };

    return ( 
        <React.Fragment>
              <FullPage>
                <Slide>
                  <div className="particle-canvas row">
                    {/* <Particles params={particleOptions} className="particleCanvas" style={{ position: 'absolute', backgroundColor: 'white', }} /> */}
                    <motion.div className="canvas-overlap typewriter" initial={{ y: '-100vw' }} animate={{ y: 0 }} transition={{ duration: 1.5, type: 'spring', mass: 1 }}>
                      <RotatingText items={['Hello There ?', 'This is Aadarsh velu !']} />
                    </motion.div>
                    <motion.div className="canvas-overlap avatar" initial={{ x: '-18vw' }} animate={{ x: 0 }} transition={{ duration: 1, type: 'tween', ease: 'easeOut' }} >
                      <img src={avatar} alt="" className="img" />
                    </motion.div>
                    {/* <motion.div className="canvas-overlap message" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.5, loop: Infinity }}>
                      Wanna Know About Me ?
                    </motion.div> */}
                    <motion.div className="canvas-overlap downIcon" animate={{ y: [-15, 15, -15] }} transition={{ duration: 2, ease: "easeInOut", loop: Infinity, }}>
                      <BsChevronDown/>
                    </motion.div>
                  </div>
                </Slide>
                <Slide> 
                <div className="designTop">
                    <img src={design} alt="" style={{ width: '1000px', height: '300px' }}/>
                  </div>
                  <div className="designBottom">
                    <img src={design} alt="" style={{ width: '1000px', height: '300px' }}/>
                  </div>
                  <div className="">
                  <div className="row">
                    <motion.div className="col-lg-5 pl-4 skillSet" >
                      <motion.img className="" src={SkillSet} alt="" style={{ width: '600px', height: '680px' }} initial={{ y: 0 }}  animate={{ y: [-20, 20, -20] }} transition={{ duration: 1.5, ease: "easeInOut", loop: Infinity, }}/>
                    </motion.div>
                    <div className="col-lg-7">
                      <div className="col" style={{ paddingTop: '90px' }}>
                          <motion.img className="summary" src={summaryOne} alt="" whileHover={{ scale: 1.3 }} transition={{ ease: 'backOut', duration: 0.8}}/>
                      </div>
                      <div className="col d-flex justify-content-end">
                        <motion.img className="" src={avatar2} alt="" style={{ width: '400px', height: '280px' }}  initial={{ opacity: 1 }} whileHover={{ opacity: 0 }} transition={{ ease: 'backOut', duration: 0.4}}/>
                      </div>
                    </div>
                  </div>
                  </div>
                </Slide>
                <Slide>
                  <div className="row">
                    <div className="col">
                      <motion.img className="" src={avatar3} alt="" style={{ width: '600px', height: '350px' }}  initial={{ opacity: 1 }} whileHover={{ opacity: 0 }} transition={{ ease: 'backOut', duration: 0.4}}/>
                    </div>
                  </div>
                </Slide>
            </FullPage> 
        </React.Fragment>
     );
}
 
export default portfolio;

{/* <div className="design">
  <img className="img" src={design} alt="" style={{ width: '300px', height: '150px' }}/>
</div> */}