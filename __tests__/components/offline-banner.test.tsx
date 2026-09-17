import { render, screen, act } from "@testing-library/react";
import { OfflineBanner } from "@/components/offline-banner";

describe("OfflineBanner", () => {
  const originalOnLine = navigator.onLine;

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", {
      value: originalOnLine,
      writable: true,
    });
  });

  it("does not render when online", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
    });

    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders offline warning message when offline", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
    });

    render(<OfflineBanner />);
    expect(
      screen.getByText(/You are currently offline/i)
    ).toBeInTheDocument();
  });

  it("updates visibility when window offline and online events fire", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
    });

    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();

    // Trigger offline event
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(
      screen.getByText(/You are currently offline/i)
    ).toBeInTheDocument();

    // Trigger online event
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(container).toBeEmptyDOMElement();
  });
});
