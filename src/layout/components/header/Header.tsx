import React from "react";
import { Button, Col, Form, Navbar, Row } from "react-bootstrap";
import AddressBar from "../addressbar/AddressBar";

const Header: React.FC = () => {
  return (
    <Row>
      <Col>
        <Navbar sticky="top">
          <Navbar.Brand>ProtoUI</Navbar.Brand>

          <Form inline className="w-100">
            <Form.Control className="flex-grow-1" type="url" placeholder="Address" />
            <Button className="ml-2" type="submit">Run</Button>
          </Form>
        </Navbar>
      </Col>
    </Row>
  );
}

export default Header;
