import React from "react";

type State = {
  hasError: boolean;
  error: any;
};

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "24px",
            borderRadius: "12px",
            background: "#FFF1F1",
            border: "1px solid #FFBABA",
            color: "#B00020",
            marginTop: "24px"
          }}
        >
          <h3 style={{ margin: 0 }}>Something went wrong</h3>
          <p style={{ marginTop: "8px", fontSize: "14px" }}>
            The component failed to load. Check console for details.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
