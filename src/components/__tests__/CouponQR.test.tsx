import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { CouponQR } from "../CouponQR";

describe("CouponQR", () => {
  it("renders an svg for the value", () => {
    const { container } = render(<CouponQR value="ABC123" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
  it("respects custom size", () => {
    const { container } = render(<CouponQR value="X" size={120} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
