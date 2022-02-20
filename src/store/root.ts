import { routerMiddleware } from 'connected-react-router';
import { createHashHistory } from 'history';
import { applyMiddleware, compose, createStore, Store } from 'redux';
import createRootReducer from '../reducers/root';

export const history = createHashHistory();

function configureStore(): Store {
  return createStore(
    createRootReducer(history),
    compose(
      applyMiddleware(routerMiddleware(history)),
    ),
  );
}

export default configureStore;
