/**
 * Hook for managing loading states and error handling
 * Provides consistent loading UI patterns and error recovery
 */

import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';

export interface LoadingState<T = any> {
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  data: T | null;
  timestamp: number | null;
}

export interface LoadingOptions {
  initialData?: any;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  showErrorAlert?: boolean;
  errorAlertTitle?: string;
}

export function useLoadingState<T = any>(
  options: LoadingOptions = {}
) {
  const {
    initialData = null,
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 2000,
    showErrorAlert = true,
    errorAlertTitle = 'Error',
  } = options;

  const [state, setState] = useState<LoadingState<T>>({
    isLoading: false,
    isRefreshing: false,
    error: null,
    data: initialData,
    timestamp: null,
  });

  const [retryCount, setRetryCount] = useState(0);

  const startLoading = useCallback((isRefresh = false) => {
    setState(prev => ({
      ...prev,
      isLoading: !isRefresh,
      isRefreshing: isRefresh,
      error: null,
    }));
    setRetryCount(0);
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      isRefreshing: false,
      error: null,
      data,
      timestamp: Date.now(),
    }));
  }, []);

  const setError = useCallback((error: string | Error) => {
    const errorMessage = typeof error === 'string' ? error : error.message;

    setState(prev => ({
      ...prev,
      isLoading: false,
      isRefreshing: false,
      error: errorMessage,
    }));

    if (showErrorAlert) {
      Alert.alert(
        errorAlertTitle,
        errorMessage,
        [
          {
            text: 'OK',
            style: 'default',
          },
          autoRetry && retryCount < maxRetries
            ? {
                text: 'Retry',
                style: 'default',
                onPress: () => {
                  // Retry logic handled by caller
                },
              }
            : undefined,
        ].filter(Boolean) as any[]
      );
    }

    // Auto-retry logic
    if (autoRetry && retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
    }
  }, [autoRetry, maxRetries, retryCount, showErrorAlert, errorAlertTitle]);

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
    setRetryCount(0);
  }, []);

  const refresh = useCallback(() => {
    startLoading(true);
  }, [startLoading]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isRefreshing: false,
      error: null,
      data: initialData,
      timestamp: null,
    });
    setRetryCount(0);
  }, [initialData]);

  // Auto-retry effect
  useEffect(() => {
    if (autoRetry && state.error && retryCount > 0 && retryCount <= maxRetries) {
      const timer = setTimeout(() => {
        // Trigger retry - caller should handle the actual retry
        // This just provides the timing
      }, retryDelay * retryCount); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [autoRetry, state.error, retryCount, maxRetries, retryDelay]);

  return {
    // State
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    data: state.data as T,
    timestamp: state.timestamp,
    retryCount,

    // Actions
    startLoading,
    setData,
    setError,
    clearError,
    refresh,
    reset,

    // Helper flags
    hasError: !!state.error,
    hasData: state.data !== null,
    isEmpty: state.data === null && !state.isLoading && !state.error,
    isInitialLoading: state.isLoading && !state.isRefreshing && state.data === null,
    isLoadingOrRefreshing: state.isLoading || state.isRefreshing,
  };
}

/**
 * Hook for handling async operations with loading states
 */
export function useAsyncOperation<T = any, Args extends any[] = any[]>(
  asyncFn: (...args: Args) => Promise<T>,
  options: LoadingOptions & {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    onSuccess,
    onError,
    ...loadingOptions
  } = options;

  const loadingState = useLoadingState<T>(loadingOptions);

  const execute = useCallback(async (...args: Args): Promise<T | null> => {
    try {
      loadingState.startLoading();
      const result = await asyncFn(...args);
      loadingState.setData(result);
      onSuccess?.(result);
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      loadingState.setError(err);
      onError?.(err);
      return null;
    }
  }, [asyncFn, loadingState, onSuccess, onError]);

  return {
    ...loadingState,
    execute,
  };
}

/**
 * Hook for handling paginated data with loading states
 */
export function usePaginatedData<T = any>(
  fetchPage: (page: number, limit: number) => Promise<T[]>,
  options: LoadingOptions & {
    pageSize?: number;
    initialPage?: number;
  } = {}
) {
  const {
    pageSize = 20,
    initialPage = 1,
    ...loadingOptions
  } = options;

  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [allData, setAllData] = useState<T[]>([]);

  const loadingState = useLoadingState<T[]>({
    ...loadingOptions,
    initialData: [],
  });

  const loadPage = useCallback(async (pageNum: number, isRefresh = false) => {
    if (!hasMore && !isRefresh) return;

    try {
      if (isRefresh) {
        loadingState.startLoading(true);
      } else {
        loadingState.startLoading();
      }

      const data = await fetchPage(pageNum, pageSize);

      if (isRefresh) {
        setAllData(data);
        setPage(1);
      } else {
        setAllData(prev => [...prev, ...data]);
        setPage(pageNum);
      }

      // Check if there's more data
      setHasMore(data.length === pageSize);
      loadingState.setData(isRefresh ? data : [...allData, ...data]);
    } catch (error) {
      loadingState.setError(error as Error);
    }
  }, [fetchPage, pageSize, hasMore, loadingState, allData]);

  const loadNextPage = useCallback(() => {
    if (!loadingState.isLoading && hasMore) {
      loadPage(page + 1);
    }
  }, [loadPage, page, loadingState.isLoading, hasMore]);

  const refresh = useCallback(() => {
    loadPage(1, true);
  }, [loadPage]);

  return {
    ...loadingState,
    data: allData,
    page,
    hasMore,
    loadNextPage,
    refresh,
    reset: () => {
      loadingState.reset();
      setAllData([]);
      setPage(initialPage);
      setHasMore(true);
    },
  };
}

/**
 * Hook for handling real-time data with loading states
 */
export function useRealtimeData<T = any>(
  subscribeFn: (onData: (data: T) => void, onError: (error: Error) => void) => () => void,
  options: LoadingOptions = {}
) {
  const loadingState = useLoadingState<T>(options);

  useEffect(() => {
    const unsubscribe = subscribeFn(
      (data) => {
        loadingState.setData(data);
      },
      (error) => {
        loadingState.setError(error);
      }
    );

    return unsubscribe;
  }, [subscribeFn, loadingState]);

  return loadingState;
}