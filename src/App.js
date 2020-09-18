import React from 'react';
import '../node_modules/bootstrap/dist/css/bootstrap.css';
import '../node_modules/bootstrap/dist/css/bootstrap-grid.css';

// router 
import { Switch, Route, } from 'react-router-dom'

// router transitions
import { PageTransition } from '@steveeeie/react-page-transition';

// Core CSS
import './assets/css/style.css';

// Home Component.
import Home from './components/home/index';

// Skills Component
import Skills from './components/skills/index';

// Work Compponent
import Work from './components/work/index';

class App extends React.Component{

    render() {

        return (
          <React.Fragment >
            <Switch>
            <Route
              render={({ location }) => {
                return (
                  <PageTransition
                    preset="fall"
                    transitionKey={location.pathname}
                  >
                    <Switch location={location}>
                      <Route exact path="/" component={Home} />
                      <Route path="/Skills" component={Skills} />
                      <Route path="/Work" component={Work} />
                    </Switch>
                  </PageTransition>
                );
              }}
            />
            </Switch>            
          </React.Fragment>
        );
    };

}

export default App;