import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type EventHandlers = Record<string, (...args: unknown[]) => void>;

let sharedConnection: signalR.HubConnection | null = null;

function getConnection(): signalR.HubConnection {
  if (!sharedConnection) {
    sharedConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}/hubs/monitoring`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }
  return sharedConnection;
}

/** Subscribes to SignalR hub events for the lifetime of the component. Silently no-ops if the hub is unreachable. */
export function useSignalR(handlers: EventHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const connection = getConnection();
    const eventNames = Object.keys(handlersRef.current);

    const bound = eventNames.map(name => {
      const fn = (...args: unknown[]) => handlersRef.current[name]?.(...args);
      connection.on(name, fn);
      return { name, fn };
    });

    if (connection.state === signalR.HubConnectionState.Disconnected) {
      connection.start().catch(() => {
        // Backend/hub not reachable yet — pages already poll on an interval as a fallback.
      });
    }

    return () => {
      bound.forEach(({ name, fn }) => connection.off(name, fn));
    };
  }, []);
}
