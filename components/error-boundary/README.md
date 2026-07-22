# Error Boundaries

This directory contains error boundary components and utilities for better error handling in the Next.js application.

## Components

### ErrorBoundary
A React error boundary component that catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Usage:**
```tsx
import { ErrorBoundary } from "@/components/error-boundary"

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

**Props:**
- `children`: React components to wrap
- `fallback`: Custom fallback component (optional)
- `onError`: Error callback function (optional)

### TradingViewErrorBoundary
A specialized error boundary for TradingView chart components with specific error messages and recovery options.

**Usage:**
```tsx
import TradingViewErrorBoundary from "@/components/error-boundary/tradingview-error-boundary"

<TradingViewErrorBoundary>
  <TradingViewChart />
</TradingViewErrorBoundary>
```

## Hooks

### useErrorBoundary
A custom hook that provides error boundary functionality for functional components.

**Usage:**
```tsx
import { useErrorBoundary } from "@/components/error-boundary"

function MyComponent() {
  const { error, hasError, resetError, throwError } = useErrorBoundary()

  if (hasError) {
    return <div>Error occurred: {error?.message}</div>
  }

  return <div>Your component content</div>
}
```

### withErrorBoundary
A higher-order component that wraps components with error boundary functionality.

**Usage:**
```tsx
import { withErrorBoundary } from "@/components/error-boundary"

const WrappedComponent = withErrorBoundary(MyComponent)
```

## Error Pages

### global-error.tsx
Next.js global error page that catches errors in the root layout.

### not-found.tsx
Custom 404 page for better user experience.

## Error Reporting

### errorReporter
A utility for reporting errors to monitoring services.

**Usage:**
```tsx
import { errorReporter } from "@/lib/error-reporting"

// Report an error
errorReporter.reportError(error, {
  component: "MyComponent",
  action: "UserAction",
  severity: "high",
})

// Wrap functions with error reporting
const safeFunction = errorReporter.wrapFunction(myFunction, {
  component: "MyComponent",
  severity: "medium",
})
```

## Implementation

### Root Layout
The root layout includes error boundaries at the top level:

```tsx
<ErrorBoundary>
  <Providers>
    <ErrorReporterInit />
    {children}
  </Providers>
</ErrorBoundary>
```

### dApp Layout
The dApp layout includes additional error boundaries for the main content area:

```tsx
<ErrorBoundary>
  <div className="flex flex-1 flex-col">{children}</div>
</ErrorBoundary>
```

## Features

- **Graceful Error Handling**: Prevents app crashes with fallback UIs
- **Error Reporting**: Automatic error reporting to monitoring services
- **Development Details**: Shows error details in development mode
- **Recovery Options**: Retry and navigation options for users
- **Specialized Boundaries**: Component-specific error boundaries
- **Global Error Handling**: Catches unhandled errors and promise rejections

## Best Practices

1. **Wrap Critical Components**: Use error boundaries around components that might fail
2. **Provide Recovery Options**: Always give users a way to recover from errors
3. **Log Errors**: Use the error reporter to track errors in production
4. **Test Error Scenarios**: Test how your app behaves when errors occur
5. **Keep Boundaries Small**: Don't wrap too much in a single error boundary

## Integration with Monitoring Services

The error reporter can be easily integrated with services like:
- Sentry
- LogRocket
- Bugsnag
- Custom error reporting endpoints

See `lib/error-reporting.ts` for implementation details. 