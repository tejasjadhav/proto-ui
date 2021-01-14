import React, { ChangeEvent } from 'react';
import { IpcRenderer, Dialog, remote } from 'electron';

import AceEditor from 'react-ace';
import { Button, Col, Container, Form, InputGroup, Nav, Row, Tab } from 'react-bootstrap';
import { FileEarmarkArrowUpFill, PlusCircle, XCircle } from 'react-bootstrap-icons';
import { connect, ConnectedProps } from 'react-redux';
import {
  deleteTab,
  loadDefaultRequestMetadata,
  newTab,
  refreshProtoDefinitions,
  setActiveTab,
  setAddress,
  setMethod,
  setRequestBody,
  setResponseBody,
  setRequestMetadata,
  setService,
} from '../../actions/tabs';
import { IPC_EXECUTE_GRPC_REQUEST, IPC_LOAD_PROTO } from '../../types/ipc';
import { TabsState } from '../../types/states';

import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-json5';
import 'ace-builds/src-noconflict/theme-github';

const electron = window.require('electron');
const ipcRenderer: IpcRenderer = electron.ipcRenderer;
const dialog: Dialog = remote.dialog;

const connector = connect((state: TabsState): TabsState => state, {
  newTab,
  setActiveTab,
  deleteTab,
  setService,
  setAddress,
  setMethod,
  setRequestMetadata,
  loadDefaultRequestMetadata,
  setRequestBody,
  setResponseBody,
  refreshProtoDefinitions,
});
type PropsFromRedux = ConnectedProps<typeof connector>;

const Home = (props: PropsFromRedux) => {
  console.dir(ipcRenderer);
  return (
    <Container fluid>
      <Row>
        <Col lg="2">
          Sidebar
        </Col>
        <Col lg="10">
          <Tab.Container activeKey={props.activeTab} onSelect={activeKey => props.setActiveTab(activeKey || '')}
            transition={false}>
            <Row>
              <Col>
                <Nav variant="tabs">
                  {props.tabs.map((tab) => (
                    <Nav.Item key={tab.id}>
                      <Nav.Link eventKey={tab.id}>
                        <span className="tab-title">{tab.address || 'New tab'}</span>
                        <Button className="p-0 pl-1 pb-1" type="button" variant="outline" title="Close tab"
                          onClick={() => props.deleteTab(tab.id)}><XCircle /></Button>
                      </Nav.Link>
                    </Nav.Item>
                  ))}

                  <Button type="button" variant="outline" title="New tab" onClick={props.newTab}><PlusCircle /></Button>
                </Nav>
              </Col>
            </Row>
            <Row>
              <Col>
                <Tab.Content>
                  {props.tabs.map((tab) => (
                    <Tab.Pane key={tab.id} eventKey={tab.id}>
                      <Form>
                        <Row className="mt-3">
                          <Col>
                            <Button onClick={() => dialog.showOpenDialog({
                              filters: [
                                { name: 'Proto files', extensions: ['proto'] },
                              ],
                              properties: ['openFile'],
                            })
                              .then(value => {
                                if (value.canceled) {
                                  return;
                                }

                                ipcRenderer.invoke(IPC_LOAD_PROTO, value.filePaths[0])
                                  .then(props.refreshProtoDefinitions)
                                  .catch(console.error);
                              })
                              .catch(err => console.error(err))
                            }>Load proto</Button>
                            <Form.Group>
                              <InputGroup>
                                <InputGroup.Prepend>
                                  <Form.Control
                                    className="rounded-0 border-right-0"
                                    as="select"
                                    value={tab.service}
                                    // @ts-ignore
                                    onChange={(event: ChangeEvent) => props.setService(tab.id, event.target.value)}
                                  >
                                    <option value="">-</option>
                                    {props.protoDefinition.services.map((service) => (
                                      <option key={service.name} value={service.name}>{service.name}</option>
                                    ))}
                                  </Form.Control>
                                </InputGroup.Prepend>
                                <Form.Control
                                  type="url"
                                  placeholder="Address"
                                  value={tab.address}
                                  // @ts-ignore
                                  onChange={(event: ChangeEvent) => props.setAddress(tab.id, event.target.value)}
                                />
                                <InputGroup.Append>
                                  <InputGroup.Text>/</InputGroup.Text>
                                  <Form.Control
                                    className="rounded-0 border-left-0 border-right-0"
                                    as="select"
                                    value={tab.method}
                                    // @ts-ignore
                                    onChange={(event: ChangeEvent) => props.setMethod(tab.id, event.target.value)}
                                  >
                                    <option value="">-</option>
                                    {tab.rpcMetadata.methods.map((method) => (
                                      <option key={method} value={method}>{method}</option>
                                    ))}
                                  </Form.Control>
                                  <Button type="button" onClick={() => {
                                    ipcRenderer.invoke(IPC_EXECUTE_GRPC_REQUEST, {
                                      address: tab.address,
                                      service: tab.service,
                                      protoPath: tab.rpcMetadata.protoPath,
                                      method: tab.method,
                                      requestMetadata: JSON.parse(tab.metadata),
                                      requestBody: JSON.parse(tab.requestBody),
                                    })
                                      .then(body => props.setResponseBody(tab.id, body))
                                      .catch(console.error);
                                  }}>Run</Button>
                                </InputGroup.Append>
                              </InputGroup>
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col>
                            <Form.Group>
                              <Form.Label>Metadata</Form.Label>
                              <AceEditor
                                mode="json5"
                                theme="github"
                                value={tab.metadata}
                                onChange={(value: string) => props.setRequestMetadata(tab.id, value)}
                                className="editor"
                                width="initial"
                                height=""
                                fontSize={16}
                                minLines={2}
                                maxLines={Infinity}
                                showGutter={true}
                                showPrintMargin={false}
                                name={tab.id}
                                setOptions={{
                                  enableBasicAutocompletion: true,
                                  tabSize: 2,
                                  useSoftTabs: true,
                                  showFoldWidgets: true,
                                }} />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col>
                            <Form.Group>
                              <Form.Label>Request body
                                <Button className="ml-1" size="sm" variant="info"
                                  onClick={() => props.loadDefaultRequestMetadata(tab.id)}
                                >
                                  <FileEarmarkArrowUpFill /> Load template
                                </Button>
                              </Form.Label>
                              <AceEditor
                                mode="json5"
                                theme="github"
                                value={tab.requestBody}
                                onChange={(value: string) => props.setRequestBody(tab.id, value)}
                                className="editor"
                                width="initial"
                                height=""
                                fontSize={16}
                                minLines={5}
                                maxLines={Infinity}
                                showGutter={true}
                                showPrintMargin={false}
                                name={tab.id}
                                setOptions={{
                                  enableBasicAutocompletion: true,
                                  tabSize: 2,
                                  useSoftTabs: true,
                                  showFoldWidgets: true,
                                }} />
                            </Form.Group>
                          </Col>
                        </Row>
                        <Row>
                          <Col>
                            <Form.Group>
                              <Form.Label>Response body</Form.Label>
                              <AceEditor
                                mode="json5"
                                theme="github"
                                value={JSON.stringify(tab.responseBody, null, 2)}
                                className="editor"
                                width="initial"
                                height=""
                                fontSize={16}
                                minLines={5}
                                maxLines={Infinity}
                                readOnly={true}
                                showGutter={true}
                                showPrintMargin={false}
                                name={tab.id}
                                setOptions={{
                                  enableBasicAutocompletion: true,
                                  tabSize: 2,
                                  useSoftTabs: true,
                                  showFoldWidgets: true,
                                }} />
                            </Form.Group>
                          </Col>
                        </Row>
                      </Form>
                    </Tab.Pane>
                  ))}
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Col>
      </Row>
    </Container>
  );
};

export default connector(Home);
