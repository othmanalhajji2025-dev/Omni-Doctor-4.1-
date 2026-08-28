import React, { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Global Error Boundary Caught Exception]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 text-center bg-slate-900 border-rose-900/60 shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-800 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-950/50">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">
                حدث استثناء غير متوقع في واجهة النظام
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                تم عزل الخطأ وحماية بيانات الجلسة الصحية بأمان لمنع فقدان البيانات أو تسريبها.
              </p>
            </div>

            <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800/80 text-left font-mono text-xs text-rose-300 max-h-32 overflow-y-auto">
              {this.state.error?.message || 'Unknown Clinical UI Exception'}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button
                variant="outline"
                onClick={this.handleGoHome}
                leftIcon={<Home className="w-4 h-4" />}
              >
                العودة للرئيسية
              </Button>
              <Button
                variant="primary"
                onClick={this.handleReset}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                إعادة تحميل التطبيق
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
