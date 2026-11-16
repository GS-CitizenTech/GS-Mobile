import { useState } from 'react';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

export default function RootNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  function handleDemoLogin() {
    setIsAuthenticated(true);
  }

  function handleLogout() {
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    return (
      <AuthNavigator
        onDemoLogin={handleDemoLogin}
      />
    );
  }

  return (
    <AppNavigator
      onLogout={handleLogout}
    />
  );
}