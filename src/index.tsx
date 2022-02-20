import 'bootstrap/dist/css/bootstrap.min.css';
import { ConnectedRouter } from 'connected-react-router';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router';
import App from './App';
import './index.css';
import ProtoManager from './layout/screens/ProtoManager';
import addDarkModeEventListener from './listeners/darkmode';
import * as serviceWorker from './serviceWorker';
import configureStore, { history } from './store/root';

const store = configureStore();
addDarkModeEventListener(store.dispatch);

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Switch>
        <Route exact path="/" component={App} />
        <Route exact path="/proto-manager" component={ProtoManager} />
      </Switch>
    </ConnectedRouter>
  </Provider>
  , document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
