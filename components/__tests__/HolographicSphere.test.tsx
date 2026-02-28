import React from "react";
import { render } from "@testing-library/react";
import HolographicSphere from "../HolographicSphere";

// Mock Three.js
jest.mock("three", () => ({
  Scene: jest.fn(),
  PerspectiveCamera: jest.fn(),
  WebGLRenderer: jest.fn(() => ({
    setSize: jest.fn(),
    setClearColor: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    domElement: { parentNode: { removeChild: jest.fn() } },
  })),
  IcosahedronGeometry: jest.fn(),
  MeshPhongMaterial: jest.fn(),
  Mesh: jest.fn(() => ({
    rotation: { x: 0, y: 0 },
    scale: { set: jest.fn() },
  })),
  BufferGeometry: jest.fn(() => ({
    setAttribute: jest.fn(),
  })),
  BufferAttribute: jest.fn(),
  PointsMaterial: jest.fn(),
  Points: jest.fn(),
  PointLight: jest.fn(() => ({ position: { set: jest.fn() } })),
  AmbientLight: jest.fn(),
}));

describe("HolographicSphere", () => {
  it("renders without crashing", () => {
    const { container } = render(<HolographicSphere />);
    expect(container).toBeInTheDocument();
  });

  it("accepts isDeploying prop", () => {
    const { container } = render(<HolographicSphere isDeploying={true} />);
    expect(container).toBeInTheDocument();
  });

  it("renders a div with correct classes", () => {
    const { container } = render(<HolographicSphere />);
    const div = container.querySelector("div");
    expect(div).toHaveClass("w-full");
    expect(div).toHaveClass("h-48");
    expect(div).toHaveClass("rounded-2xl");
  });
});
