import { IpcRenderer } from 'electron';
import React from 'react';
import { Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { IPC_PROTO_MANAGER_GET_SERVICES } from '../../types/ipc';

const electron = window.require('electron');
const ipcRenderer: IpcRenderer = electron.ipcRenderer;

const ProtoManager = () => {
  return (
    <React.Fragment>
      <h1>Proto Manager</h1>
      <Link to="/">Home</Link>
      <Button onClick={() => {
        ipcRenderer.invoke(IPC_PROTO_MANAGER_GET_SERVICES)
          .then(console.info)
          .catch(console.error);
      }}>Click me</Button>
    </React.Fragment>
  );
};

export default ProtoManager;
