import React from "react";
import { Button, Col, Form, Row } from "react-bootstrap";

const AddressBar: React.FC = () => {
  return (
    <Form inline className="w-100">
      <Form.Control className="flex-grow-1" type="url" placeholder="Address" />
      <Button className="ml-2" type="submit">Run</Button>
    </Form>
  );
}

export default AddressBar;
