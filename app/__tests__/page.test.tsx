import React from "react";
import { render, screen } from "@testing-library/react";
import MyceloForge from "../page";

// Mock the dynamic imports
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) =>
    children ? children() : <div data-testid="dynamic-component">Mocked Component</div>,
}));

jest.mock("../../components/Scene", () => {
  return function MockScene() {
    return <div data-testid="scene">Scene Component</div>;
  };
});

jest.mock("../../components/HolographicSphere", () => {
  return function MockSphere() {
    return <div data-testid="sphere">Sphere Component</div>;
  };
});

describe("MyceloForge Page", () => {
  it("renders the title", () => {
    render(<MyceloForge />);
    const title = screen.getByText("MYCELOFORGE");
    expect(title).toBeInTheDocument();
  });

  it("renders the deploy button", () => {
    render(<MyceloForge />);
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("renders the textarea for empire seed input", () => {
    render(<MyceloForge />);
    const textarea = screen.getByPlaceholderText("Enter your empire seed...");
    expect(textarea).toBeInTheDocument();
  });
});
