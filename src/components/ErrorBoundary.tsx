import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">เกิดข้อผิดพลาดในการแสดงผล</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            {this.state.error?.message || "ไม่สามารถโหลดหน้านี้ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                this.setState({ hasError: false });
                window.history.back();
              }}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> ย้อนกลับ
            </Button>
            <Button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" /> รีเฟรชหน้า
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
