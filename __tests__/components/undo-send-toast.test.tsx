import { render, screen, fireEvent, act } from "@testing-library/react";
import { UndoSendToast } from "@/components/mail/undo-send-toast";

describe("UndoSendToast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns null and does not render when visible is false", () => {
    const { container } = render(
      <UndoSendToast
        visible={false}
        recipient="user@example.com"
        onUndo={jest.fn()}
        onConfirmSend={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders recipient email when visible is true", () => {
    render(
      <UndoSendToast
        visible={true}
        recipient="target@example.com"
        onUndo={jest.fn()}
        onConfirmSend={jest.fn()}
      />
    );

    expect(screen.getByText(/Sending email to/i)).toBeInTheDocument();
    expect(screen.getByText("target@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();
  });

  it("invokes onUndo when Undo button is clicked", () => {
    const onUndo = jest.fn();
    const onConfirmSend = jest.fn();

    render(
      <UndoSendToast
        visible={true}
        recipient="test@example.com"
        onUndo={onUndo}
        onConfirmSend={onConfirmSend}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /undo/i }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("automatically calls onConfirmSend when countdown finishes", () => {
    const onUndo = jest.fn();
    const onConfirmSend = jest.fn();

    render(
      <UndoSendToast
        visible={true}
        recipient="auto@example.com"
        onUndo={onUndo}
        onConfirmSend={onConfirmSend}
        durationMs={3000}
      />
    );

    expect(onConfirmSend).not.toHaveBeenCalled();

    // Fast-forward 3000ms
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onConfirmSend).toHaveBeenCalledTimes(1);
    expect(onUndo).not.toHaveBeenCalled();
  });
});
