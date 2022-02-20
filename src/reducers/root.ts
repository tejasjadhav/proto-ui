import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import tabsReducer from './tabs';
import { History } from 'history';

const createRootReducer = (history: History<any>) => combineReducers({
  router: connectRouter(history),
  tabs: tabsReducer,
});

export default createRootReducer;
