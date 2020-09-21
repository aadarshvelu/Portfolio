import React from 'react';
import '../node_modules/bootstrap/dist/css/bootstrap.css';
import '../node_modules/bootstrap/dist/css/bootstrap-grid.css';

// router 
import { Switch, Route, useHistory  } from 'react-router-dom'

// router transitions
import { PageTransition } from '@steveeeie/react-page-transition';

// Loader
import Loader from './components/loader/index';

// Core CSS
import './assets/css/style.css';

// Global State Context
import GlobalState from './context/globalState';

// Common Deps
import design from './assets/design.svg';

import logo from './assets/logo.gif';

// Home Components Deps
import homeAvatar from './assets/avatar/ava1.svg';

// Skills Components Deps
import summaryOne from './assets/summary1.svg';

import skillsAvatar from './assets/avatar/ava2.svg';

import RRLogo from './assets/components/logo/redux.svg';

import reactNative from './assets/components/logo/react.svg';

import node from './assets/components/logo/node.svg';

import typescript from './assets/components/logo/ts.svg';

import java from './assets/components/logo/java.svg';

import mongoDB from './assets/components/logo/mongoDB.svg';

import firebase from './assets/components/logo/firebase.svg';

// Work Components Deps
import project1 from './assets/components/p1.svg';

import project2 from './assets/components/p2.svg';

import project3 from './assets/components/p3.svg';

import workAvatar from './assets/avatar/ava3.svg';

// Contact Components Deps
import summaryTwo from './assets/summary2.svg';

import contactAvatar from './assets/avatar/ava4.svg';

import insta from './assets/components/logo/insta.svg';

import gmail from './assets/components/logo/gmail.svg';

import linkedIn from './assets/components/logo/linkedIn.svg';

// Home Component.
import Home from './components/home/index';

// Skills Component
import Skills from './components/skills/index';

// Work Compponent
import Work from './components/work/index';

// Contact Component
import Contact from './components/contact/index';

const App =  () => {

  const [globalStateValues, updateGlobalStateValues] = React.useState({});

  const commonComponent = [], homeComponent = [], skillsComponent = [], workComponent = [], contactComponent = [];

  const history = useHistory()

  const updateRegistry = async (ctx) => {

    switch (ctx) {
      case 'common':
        commonComponent.push(ctx)
        break;
      case 'home':
        homeComponent.push(ctx)
        break;
      case 'skills':
        skillsComponent.push(ctx)
        break;
      case 'work':
        workComponent.push(ctx)  
        break;
      case 'contact':
        contactComponent.push(ctx)
        break;
      default:
        break;
    }

    if (homeComponent.length === 1 && commonComponent.length === 2 && skillsComponent.length === 9 && workComponent.length === 4 && contactComponent.length === 5) {
      const values = {
          design,
          logo,
          homeAvatar,
          skillsAvatar,
          summaryOne,
          RRLogo,
          reactNative,
          node,
          typescript,
          java,
          mongoDB,
          firebase,
          workAvatar,
          project1,
          project2,
          project3,
          summaryTwo,
          contactAvatar,
          insta,
          gmail,
          linkedIn,
        }
        history.push('/Home')
        updateGlobalStateValues(values)
    } 
  }

  return (
    <React.Fragment>
      <GlobalState.Provider value={globalStateValues}>
        <Route
          render={({ location }) => {
            console.log(location, location.pathname)
            return (
              <PageTransition
                preset="fall"
                transitionKey={location.pathname}
              >
                <Switch location={location}>
                  <Route exact path="/" component={Loader} />
                  <Route path="/Home" component={Home} />
                  <Route path="/Skills" component={Skills} />
                  <Route path="/Work" component={Work} />
                  <Route path="/Contact" component={Contact} />
                </Switch>
              </PageTransition>
            );
          }}
        />
      </GlobalState.Provider>
      <div className="starter"  style={{ display: 'none' }}>
          {/* Common Deps */}
          <img src={design} alt="" onLoad={() => updateRegistry('common')}  style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={logo} alt="" onLoad={() => updateRegistry('common')}  style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>

          {/* Home Deps */}
          <img src={homeAvatar} alt="" onLoad={() => updateRegistry('home')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>

          {/* Skills Deps */}
          <img src={skillsAvatar} alt="" onLoad={() => updateRegistry('skills')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={summaryOne} alt="" onLoad={() => updateRegistry('skills')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={RRLogo} alt="" onLoad={() => updateRegistry('skills')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={reactNative} alt="" onLoad={() => updateRegistry('skills')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={node} alt="" onLoad={() => updateRegistry('skills')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={typescript} alt="" onLoad={() => updateRegistry('skills')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={java} alt="" onLoad={() => updateRegistry('skills')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={mongoDB} alt="" onLoad={() => updateRegistry('skills')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={firebase} alt="" onLoad={() => updateRegistry('skills')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>

          {/* Work Deps */}
          <img src={project1} alt="" onLoad={() => updateRegistry('work')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={project2} alt="" onLoad={() => updateRegistry('work')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={project3} alt="" onLoad={() => updateRegistry('work')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={skillsAvatar} alt="" onLoad={() => updateRegistry('work')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>

          {/* Contact Deps */}
          <img src={summaryTwo} alt="" onLoad={() => updateRegistry('contact')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={contactAvatar} alt="" onLoad={() => updateRegistry('contact')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={insta} alt="" onLoad={() => updateRegistry('contact')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={gmail} alt="" onLoad={() => updateRegistry('contact')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
          <img src={linkedIn} alt="" onLoad={() => updateRegistry('contact')} style={{ width: '0px', height: '0px', zIndex: '-9999px' }}/>
      </div>
    </React.Fragment>
  );
}

export default App;