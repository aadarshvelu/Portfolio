import React from 'react';
import Portfolio from './components/portfolio';

import '../node_modules/bootstrap/dist/css/bootstrap.css';
import '../node_modules/bootstrap/dist/css/bootstrap-grid.css';
import './App.css';

class App extends React.Component{

    render(){
        return (
          <React.Fragment >
            <Portfolio/>
          </React.Fragment>
        );
    };
 
}

export default App;